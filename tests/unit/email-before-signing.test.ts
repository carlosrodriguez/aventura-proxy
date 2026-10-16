import { beforeEach, afterEach, expect, it, vi } from "vitest";
import type { EmailSigningSession, Prisma } from "@/generated/prisma/client";
const state = vi.hoisted(() => ({
  row: null as EmailSigningSession | null,
  mail: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  proxyConfig: { campaignId: "test-campaign" },
  submissionsEnabled: () => true,
}));
vi.mock("@/lib/email", () => ({ sendEmail: state.mail }));
vi.mock("@/lib/db", () => {
  const tx = {
    $executeRaw: async () => 1,
    emailSigningSession: {
      create: async ({ data }: { data: EmailSigningSession }) =>
        (state.row = {
          ...data,
          attempts: 0,
          resendCount: 0,
          verifiedAt: null,
          consumedAt: null,
          createdAt: new Date(),
        }),
      findUnique: async ({ where }: { where: { tokenHash: string } }) =>
        state.row?.tokenHash === where.tokenHash ? { ...state.row } : null,
      findUniqueOrThrow: async () => ({ ...state.row! }),
      update: async ({
        data,
      }: {
        data: Partial<EmailSigningSession> & {
          attempts?: number | { increment: number };
          resendCount?: number | { increment: number };
        };
      }) => {
        const row = state.row!;
        for (const [key, value] of Object.entries(data)) {
          if (value && typeof value === "object" && "increment" in value)
            Reflect.set(
              row,
              key,
              Number(Reflect.get(row, key)) + Number(value.increment),
            );
          else Reflect.set(row, key, value);
        }
        return { ...row };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { tokenHash: string; email: string; campaignId: string };
        data: { consumedAt: Date };
      }) => {
        const row = state.row;
        if (
          !row ||
          row.tokenHash !== where.tokenHash ||
          row.email !== where.email ||
          row.campaignId !== where.campaignId ||
          !row.verifiedAt ||
          row.consumedAt ||
          row.accessExpiresAt <= new Date()
        )
          return { count: 0 };
        row.consumedAt = data.consumedAt;
        return { count: 1 };
      },
    },
  };
  return {
    db: () => ({
      ...tx,
      $transaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
    }),
  };
});
import { db } from "@/lib/db";
import {
  startEmailVerification,
  verifyEmailSession,
  requireVerifiedEmail,
  resendEmailVerification,
  consumeVerifiedEmail,
} from "@/lib/email-verification";
beforeEach(() => {
  state.row = null;
  state.mail.mockReset().mockResolvedValue(undefined);
  vi.stubEnv("OTP_PEPPER", "unit-test-pepper-with-at-least-32-characters");
});
afterEach(() => vi.unstubAllEnvs());
async function enroll() {
  const result = await startEmailVerification("owner@example.org");
  const code = String(state.mail.mock.calls[0][2]).match(/code is (\d{6})/)![1];
  return { ...result, code };
}
it("creates only a mailbox challenge before a signature exists", async () => {
  const { token } = await enroll();
  expect(state.row?.verifiedAt).toBeNull();
  expect(state.row?.tokenHash).not.toBe(token);
  await expect(
    requireVerifiedEmail(token, "owner@example.org"),
  ).rejects.toThrow("Verify this email");
});
it("verifies the mailbox without generating or finalizing a proxy", async () => {
  const { token, code } = await enroll();
  expect(await verifyEmailSession(token, code)).toEqual({ ok: true });
  expect(
    (await requireVerifiedEmail(token, "owner@example.org")).verifiedAt,
  ).toBeInstanceOf(Date);
  expect(state.row?.consumedAt).toBeNull();
  expect(state.mail).toHaveBeenCalledTimes(1);
});
it("does not let verification authorize another email address", async () => {
  const { token, code } = await enroll();
  await verifyEmailSession(token, code);
  await expect(
    requireVerifiedEmail(token, "other@example.org"),
  ).rejects.toThrow("Verify this email");
});
it("rejects expired codes and exhausted attempts", async () => {
  const { token, code } = await enroll();
  state.row!.codeExpiresAt = new Date(0);
  await expect(verifyEmailSession(token, code)).rejects.toThrow(
    "Code could not",
  );
  state.row!.codeExpiresAt = new Date(Date.now() + 600000);
  state.row!.attempts = 5;
  await expect(verifyEmailSession(token, code)).rejects.toThrow(
    "Code could not",
  );
});
it("counts invalid attempts and does not verify them", async () => {
  const { token, code } = await enroll();
  const wrong = code === "000000" ? "999999" : "000000";
  await expect(verifyEmailSession(token, wrong)).rejects.toThrow(
    "Code could not",
  );
  expect(state.row!.attempts).toBe(1);
  expect(state.row!.verifiedAt).toBeNull();
});
it("consumes a verified proof once, and rejects reuse", async () => {
  const { token, code } = await enroll();
  await verifyEmailSession(token, code);
  await consumeVerifiedEmail(
    db() as unknown as Prisma.TransactionClient,
    token,
    "owner@example.org",
  );
  await expect(
    consumeVerifiedEmail(
      db() as unknown as Prisma.TransactionClient,
      token,
      "owner@example.org",
    ),
  ).rejects.toThrow("Verify your email");
});
it("cannot consume unverified, expired, or wrong-email proofs", async () => {
  const { token, code } = await enroll();
  const tx = db() as unknown as Prisma.TransactionClient;
  await expect(
    consumeVerifiedEmail(tx, token, "owner@example.org"),
  ).rejects.toThrow();
  await verifyEmailSession(token, code);
  await expect(
    consumeVerifiedEmail(tx, token, "other@example.org"),
  ).rejects.toThrow();
  state.row!.accessExpiresAt = new Date(0);
  await expect(
    consumeVerifiedEmail(tx, token, "owner@example.org"),
  ).rejects.toThrow();
});
it("preserves progressive resend waits and invalidates old codes", async () => {
  const { token, code } = await enroll();
  await expect(resendEmailVerification(token)).rejects.toThrow("Please wait");
  state.row!.sentAt = new Date(Date.now() - 31000);
  const a = await resendEmailVerification(token);
  expect(a.nextResendAt - state.row!.sentAt.getTime()).toBe(120000);
  await expect(verifyEmailSession(token, code)).rejects.toThrow(
    "Code could not",
  );
  await expect(resendEmailVerification(token)).rejects.toThrow("Please wait");
  state.row!.sentAt = new Date(Date.now() - 121000);
  const b = await resendEmailVerification(token);
  expect(b.nextResendAt - state.row!.sentAt.getTime()).toBe(600000);
});
