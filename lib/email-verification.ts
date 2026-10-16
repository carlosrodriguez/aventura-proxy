import "server-only";
import { db } from "@/lib/db";
import { proxyConfig, submissionsEnabled } from "@/lib/config";
import { HttpError } from "@/lib/security/http";
import {
  checkOtp,
  generateOtp,
  otpHash,
  otpUsable,
  randomToken,
  sha256,
} from "@/lib/security/crypto";
import { sendEmail, type EmailDispatcher } from "@/lib/email";
import type { Prisma, EmailSigningSession } from "@/generated/prisma/client";
const direct: EmailDispatcher = (task) => task();
function enabled() {
  if (!submissionsEnabled())
    throw new HttpError(
      403,
      "Submissions are disabled. This site is a preview only.",
    );
}
async function session(token: string | undefined) {
  if (!token) throw new HttpError(401, "Verify your email before signing");
  const row = await db().emailSigningSession.findUnique({
    where: { tokenHash: sha256(token) },
  });
  if (
    !row ||
    row.accessExpiresAt <= new Date() ||
    row.consumedAt ||
    row.campaignId !== proxyConfig.campaignId
  )
    throw new HttpError(401, "Verify your email before signing");
  return row;
}
async function mail(
  row: EmailSigningSession,
  code: string,
  dispatch: EmailDispatcher,
) {
  await dispatch(() =>
    sendEmail(
      row.email,
      "Your Aventura Isles proxy verification code",
      `Your verification code is ${code}. It expires in 10 minutes. Verify your email before signing your proxy. Email verification confirms mailbox access, not property ownership.`,
      `email-session-${row.id}-${row.sentAt.getTime()}`,
    ),
  );
}
export async function startEmailVerification(
  email: string,
  dispatch: EmailDispatcher = direct,
) {
  enabled();
  const id = crypto.randomUUID(),
    token = randomToken(),
    code = generateOtp(),
    now = new Date();
  const row = await db().emailSigningSession.create({
    data: {
      id,
      tokenHash: sha256(token),
      email,
      campaignId: proxyConfig.campaignId,
      codeHash: otpHash(code, id),
      sentAt: now,
      codeExpiresAt: new Date(now.getTime() + 600000),
      accessExpiresAt: new Date(now.getTime() + 3600000),
    },
  });
  await mail(row, code, dispatch);
  return { token, nextResendAt: now.getTime() + 30000 };
}
export async function verifyEmailSession(
  token: string | undefined,
  code: string,
) {
  enabled();
  const current = await session(token);
  const valid = await db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT "id" FROM "EmailSigningSession" WHERE "id"=${current.id}::uuid FOR UPDATE`;
    const row = await tx.emailSigningSession.findUniqueOrThrow({
      where: { id: current.id },
    });
    if (row.consumedAt || row.accessExpiresAt <= new Date()) return false;
    if (row.verifiedAt) return true;
    if (!otpUsable(row.codeExpiresAt, row.attempts)) return false;
    await tx.emailSigningSession.update({
      where: { id: row.id },
      data: { attempts: { increment: 1 } },
    });
    if (!checkOtp(code, row.id, row.codeHash)) return false;
    await tx.emailSigningSession.update({
      where: { id: row.id },
      data: { verifiedAt: new Date(), codeHash: "consumed" },
    });
    return true;
  });
  if (!valid)
    throw new HttpError(
      400,
      "Code could not be verified. Request a new code if needed.",
    );
  return { ok: true };
}
export async function resendEmailVerification(
  token: string | undefined,
  dispatch: EmailDispatcher = direct,
) {
  enabled();
  const current = await session(token);
  const issued = await db().$transaction(async (tx) => {
    await tx.$executeRaw`SELECT "id" FROM "EmailSigningSession" WHERE "id"=${current.id}::uuid FOR UPDATE`;
    const row = await tx.emailSigningSession.findUniqueOrThrow({
      where: { id: current.id },
    });
    if (row.consumedAt || row.accessExpiresAt <= new Date())
      throw new HttpError(401, "Verify your email before signing");
    if (row.verifiedAt)
      throw new HttpError(409, "Verification is already complete");
    const cooldown =
      row.resendCount === 0 ? 30000 : row.resendCount === 1 ? 120000 : 600000;
    if (Date.now() - row.sentAt.getTime() < cooldown)
      throw new HttpError(429, "Please wait before requesting another code");
    const code = generateOtp(),
      now = new Date();
    const updated = await tx.emailSigningSession.update({
      where: { id: row.id },
      data: {
        codeHash: otpHash(code, row.id),
        sentAt: now,
        codeExpiresAt: new Date(now.getTime() + 600000),
        attempts: 0,
        resendCount: { increment: 1 },
      },
    });
    return {
      row: updated,
      code,
      nextResendAt: now.getTime() + (row.resendCount === 0 ? 120000 : 600000),
    };
  });
  await mail(issued.row, issued.code, dispatch);
  return { nextResendAt: issued.nextResendAt };
}
export async function requireVerifiedEmail(
  token: string | undefined,
  email: string,
) {
  enabled();
  const row = await session(token);
  if (!row.verifiedAt || row.email !== email)
    throw new HttpError(401, "Verify this email address before signing");
  return row;
}
// Single-use proof consumption is in the same transaction as the signed submission.
export async function consumeVerifiedEmail(
  tx: Prisma.TransactionClient,
  token: string,
  email: string,
) {
  const now = new Date();
  const result = await tx.emailSigningSession.updateMany({
    where: {
      tokenHash: sha256(token),
      email,
      campaignId: proxyConfig.campaignId,
      verifiedAt: { not: null },
      consumedAt: null,
      accessExpiresAt: { gt: now },
    },
    data: { consumedAt: now },
  });
  if (result.count !== 1)
    throw new HttpError(401, "Verify your email before signing");
  return tx.emailSigningSession.findUniqueOrThrow({
    where: { tokenHash: sha256(token) },
  });
}
