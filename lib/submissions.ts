import "server-only";
import sharp from "sharp";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/security/http";
import {
  checkOtp,
  duplicateKey,
  generateOtp,
  otpHash,
  otpUsable,
  randomToken,
  sha256,
} from "@/lib/security/crypto";
import { proxyConfig, submissionsEnabled, certification } from "@/lib/config";
import type { EmailDispatcher } from "@/lib/email";
import { sendEmail, receiptText } from "@/lib/email";
import { putPrivate, readPrivate, deletePrivate } from "@/lib/storage";
import { generateProxy } from "@/lib/pdf/proxy";
import type { z } from "zod";
import type { submissionSchema } from "@/lib/validation/submission";
import type { Prisma } from "@/generated/prisma/client";
const immediateEmail: EmailDispatcher = (task) => task();

export function executionTemplateVersion(): string {
  return `${proxyConfig.templateVersion}:${sha256(JSON.stringify(proxyConfig))}`;
}
export function assertEnabled() {
  if (!submissionsEnabled())
    throw new HttpError(
      403,
      "Submissions are disabled. This site is a preview only.",
    );
}
export async function authenticateSubmission(token: string | undefined) {
  if (!token) throw new HttpError(401, "Access unavailable");
  const s = await db().proxySubmission.findFirst({
    where: { accessTokenHash: sha256(token) },
  });
  if (!s || s.accessExpiresAt <= new Date())
    throw new HttpError(401, "Access unavailable");
  return s;
}
export async function createSubmission(
  data: z.infer<typeof submissionSchema>,
  ip: string,
  userAgent: string,
  dispatchEmail: EmailDispatcher = immediateEmail,
) {
  assertEnabled();
  const id = crypto.randomUUID(),
    token = randomToken();
  const signature = Buffer.from(data.signature.split(",")[1], "base64");
  if (
    signature.length > 130000 ||
    signature.length < 200 ||
    !signature
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw new HttpError(400, "Invalid signature");
  const image = sharp(signature, { limitInputPixels: 4000000 });
  const metadata = await image.metadata();
  if (
    !metadata.width ||
    !metadata.height ||
    metadata.width > 4000 ||
    metadata.height > 1000
  )
    throw new HttpError(400, "Invalid signature dimensions");
  const flattened = await image
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
  const stats = await sharp(flattened).stats();
  if (stats.channels.slice(0, 3).every((channel) => channel.stdev < 2))
    throw new HttpError(400, "Draw your signature");
  const signatureRef = `${id}/signature.png`;
  await putPrivate(signatureRef, signature, "image/png");
  const code = generateOtp(),
    sentAt = new Date();
  try {
    await db().$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${duplicateKey(data.houseNumber, data.street)}))`;
      const duplicates = await tx.proxySubmission.findMany({
        where: {
          houseNumber: { equals: data.houseNumber, mode: "insensitive" },
          street: data.street,
        },
        select: { id: true },
      });
      await tx.proxySubmission.create({
        data: {
          id,
          houseNumber: data.houseNumber,
          street: data.street,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          ownershipType: data.ownershipType,
          entityName: data.entityName || null,
          signerTitle: data.signerTitle || null,
          signedAt: sentAt,
          ipAddress: ip,
          userAgent,
          timezone: data.timezone,
          signatureRef,
          templateVersion: executionTemplateVersion(),
          accessTokenHash: sha256(token),
          accessExpiresAt: new Date(sentAt.getTime() + 3600000),
          likelyDuplicate: duplicates.length > 0,
          verification: {
            create: {
              codeHash: otpHash(code, id),
              expiresAt: new Date(sentAt.getTime() + 600000),
              sentAt,
            },
          },
          events: {
            create: {
              eventType: "SIGNED",
              metadata: {
                certification: true,
                certificationText: certification,
                electronicConsent: true,
                likelyDuplicate: duplicates.length > 0,
              },
            },
          },
        },
      });
      if (duplicates.length) {
        await tx.proxySubmission.updateMany({
          where: { id: { in: duplicates.map((s) => s.id) } },
          data: { likelyDuplicate: true },
        });
        for (const s of duplicates)
          await tx.auditEvent.create({
            data: {
              submissionId: s.id,
              eventType: "LIKELY_DUPLICATE",
              metadata: { relatedSubmissionId: id },
            },
          });
      }
    });
  } catch (error) {
    await deletePrivate(signatureRef);
    throw error;
  }
  let codeSent = true;
  await dispatchEmail(async () => {
    try {
      await sendEmail(
        data.email,
        "Your Aventura Isles proxy verification code",
        `Your verification code is ${code}. It expires in 10 minutes. Email verification is not proof of property ownership.`,
        `otp-${id}-${sentAt.getTime()}`,
      );
    } catch {
      codeSent = false;
      await event(id, "CODE_DELIVERY_FAILED", {});
    }
  });
  return { id, token, codeSent };
}
export async function verifySubmission(
  id: string,
  code: string,
  dispatchEmail: EmailDispatcher = immediateEmail,
) {
  assertEnabled();
  const valid = await db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT "id" FROM "ProxySubmission" WHERE "id"=${id}::uuid FOR UPDATE`;
    const s = await tx.proxySubmission.findUniqueOrThrow({
      where: { id },
      include: { verification: true },
    });
    if (s.accessExpiresAt <= new Date())
      throw new HttpError(401, "Access unavailable");
    if (s.status !== "SIGNED")
      return s.status === "VERIFIED" || s.status === "FINALIZED";
    const v = s.verification;
    if (!v || !otpUsable(v.expiresAt, v.attempts)) return false;
    await tx.emailVerification.update({
      where: { submissionId: id },
      data: { attempts: { increment: 1 } },
    });
    if (!checkOtp(code, id, v.codeHash)) {
      await tx.auditEvent.create({
        data: {
          submissionId: id,
          eventType: "EMAIL_VERIFICATION_FAILED",
          metadata: {},
        },
      });
      return false;
    }
    const now = new Date();
    await tx.emailVerification.update({
      where: { submissionId: id },
      data: { verifiedAt: now, codeHash: "consumed" },
    });
    await tx.proxySubmission.update({
      where: { id },
      data: { status: "VERIFIED", verifiedAt: now },
    });
    await tx.auditEvent.create({
      data: { submissionId: id, eventType: "EMAIL_VERIFIED", metadata: {} },
    });
    return true;
  });
  if (!valid)
    throw new HttpError(
      400,
      "Code could not be verified. Request a new code if needed.",
    );
  return finalizeSubmission(id, dispatchEmail);
}
export async function restartSubmission(id: string) {
  assertEnabled();
  await db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT "id" FROM "ProxySubmission" WHERE "id"=${id}::uuid FOR UPDATE`;
    const current = await tx.proxySubmission.findUniqueOrThrow({
      where: { id },
    });
    if (current.status !== "SIGNED" || current.accessExpiresAt <= new Date())
      throw new HttpError(409, "This proxy can no longer be edited");
    await tx.proxySubmission.update({
      where: { id },
      data: {
        accessExpiresAt: new Date(0),
        accessTokenHash: sha256(randomToken()),
      },
    });
    await tx.emailVerification.updateMany({
      where: { submissionId: id },
      data: { expiresAt: new Date(0) },
    });
    await tx.auditEvent.create({
      data: { submissionId: id, eventType: "DRAFT_RESTARTED", metadata: {} },
    });
  });
}

export async function resendOtp(
  id: string,
  dispatchEmail: EmailDispatcher = immediateEmail,
) {
  assertEnabled();
  const issued = await db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT "id" FROM "ProxySubmission" WHERE "id"=${id}::uuid FOR UPDATE`;
    const s = await tx.proxySubmission.findUniqueOrThrow({
      where: { id },
      include: { verification: true },
    });
    if (s.accessExpiresAt <= new Date())
      throw new HttpError(401, "Access unavailable");
    if (s.status !== "SIGNED")
      throw new HttpError(409, "Verification is already complete");
    const resendCount = await tx.auditEvent.count({
      where: { submissionId: id, eventType: "CODE_REISSUED" },
    });
    const cooldown =
      resendCount === 0 ? 30000 : resendCount === 1 ? 120000 : 600000;
    if (
      s.verification &&
      Date.now() - s.verification.sentAt.getTime() < cooldown
    )
      throw new HttpError(429, "Please wait before requesting another code");
    const code = generateOtp(),
      sentAt = new Date();
    const data = {
      codeHash: otpHash(code, id),
      sentAt,
      expiresAt: new Date(sentAt.getTime() + 600000),
      attempts: 0,
      verifiedAt: null,
    };
    await tx.emailVerification.upsert({
      where: { submissionId: id },
      create: { ...data, submissionId: id },
      update: data,
    });
    await tx.auditEvent.create({
      data: { submissionId: id, eventType: "CODE_REISSUED", metadata: {} },
    });
    return {
      email: s.email,
      code,
      sentAt,
      nextResendAt: sentAt.getTime() + (resendCount === 0 ? 120000 : 600000),
    };
  });
  await dispatchEmail(async () => {
    try {
      await sendEmail(
        issued.email,
        "Your Aventura Isles proxy verification code",
        `Your code is ${issued.code}. Expires in 10 minutes. Email verification is not proof of property ownership.`,
        `otp-${id}-${issued.sentAt.getTime()}`,
      );
    } catch {
      await event(id, "CODE_DELIVERY_FAILED", {});
      throw new Error("Email delivery failed");
    }
  });
  return { nextResendAt: issued.nextResendAt };
}

export async function finalizeSubmission(
  id: string,
  dispatchEmail: EmailDispatcher = immediateEmail,
) {
  assertEnabled();
  await db().$transaction(
    async (tx) => {
      await tx.$executeRaw`SELECT "id" FROM "ProxySubmission" WHERE "id"=${id}::uuid FOR UPDATE`;
      const s = await tx.proxySubmission.findUniqueOrThrow({ where: { id } });
      if (s.status === "FINALIZED") return;
      if (s.status !== "VERIFIED" || !s.verifiedAt)
        throw new HttpError(409, "Verification required");
      if (s.templateVersion !== executionTemplateVersion())
        throw new HttpError(
          409,
          "Template changed. Contact the operator to create a new submission.",
        );
      const pdf = await generateProxy(s, await readPrivate(s.signatureRef)),
        hash = sha256(pdf),
        now = new Date(),
        finalPdfRef = `${id}/proxy.pdf`,
        auditRef = `${id}/audit.json`;
      const envelope = {
        submissionId: id,
        propertyAddress: `${s.houseNumber} ${s.street}`,
        signerName: `${s.firstName} ${s.lastName}`,
        signerEmail: s.email,
        emailVerifiedAt: s.verifiedAt.toISOString(),
        signedAt: s.signedAt.toISOString(),
        finalizedAt: now.toISOString(),
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        timezone: s.timezone,
        pdfSha256: hash,
        applicationVersion: process.env.APP_VERSION ?? "1.0.0",
        gitCommit: process.env.GIT_COMMIT_SHA ?? null,
        templateVersion: s.templateVersion,
        ownershipAuthenticated: false,
      };
      await putPrivate(finalPdfRef, pdf, "application/pdf");
      await putPrivate(
        auditRef,
        Buffer.from(JSON.stringify(envelope, null, 2)),
        "application/json",
      );
      await tx.proxySubmission.update({
        where: { id },
        data: {
          status: "FINALIZED",
          finalizedAt: now,
          finalPdfRef,
          auditRef,
          pdfSha256: hash,
        },
      });
      await tx.auditEvent.create({
        data: {
          submissionId: id,
          eventType: "FINALIZED",
          metadata: { pdfSha256: hash },
        },
      });
    },
    { timeout: 60000 },
  );
  await dispatchEmail(async () => {
    try {
      await deliverReceipt(id);
    } catch {
      await event(id, "RECEIPT_DELIVERY_FAILED", {});
      throw new Error("Email delivery failed");
    }
  });
  return { id };
}
export async function deliverReceipt(id: string) {
  assertEnabled();
  const s = await db().proxySubmission.findUniqueOrThrow({ where: { id } });
  if (
    s.status !== "FINALIZED" ||
    !s.finalPdfRef ||
    !s.pdfSha256 ||
    !s.finalizedAt
  )
    throw new HttpError(409, "Finalization required");
  const pdf = await readPrivate(s.finalPdfRef),
    text = receiptText(id, s.finalizedAt, s.pdfSha256);
  if (!s.receiptSentAt) {
    await sendEmail(
      s.email,
      "Your signed limited proxy — October 6, 2026",
      text,
      `receipt-${id}`,
      pdf,
    );
    await db().proxySubmission.update({
      where: { id },
      data: { receiptSentAt: new Date() },
    });
    await event(id, "SIGNER_RECEIPT_SENT", {});
  }
  if (process.env.PROXY_DELIVERY_EMAIL && !s.associationSentAt) {
    await sendEmail(
      process.env.PROXY_DELIVERY_EMAIL,
      "Limited proxy for Association validation",
      text,
      `association-${id}`,
      pdf,
    );
    const now = new Date();
    await db().proxySubmission.update({
      where: { id },
      data: { associationSentAt: now, deliveredAt: now },
    });
    await event(id, "ASSOCIATION_EMAIL_SENT", {});
  }
}
export async function event(
  id: string,
  eventType: string,
  metadata: Prisma.InputJsonValue,
) {
  await db().auditEvent.create({
    data: { submissionId: id, eventType, metadata },
  });
}
