import { beforeEach, expect, it, vi } from "vitest";
import sharp from "sharp";
const state = vi.hoisted(() => ({
  rows: [] as Array<{
    id: string;
    houseNumber: string;
    street: string;
    likelyDuplicate: boolean;
    templateVersion: string;
    status?: string;
    verifiedAt?: Date;
    signedAt?: Date;
  }>,
  events: [] as Array<{ submissionId: string; eventType: string }>,
  locks: [] as string[],
  proofConsumed: false,
  proofHash: "",
}));
vi.mock("@/lib/config", () => ({
  submissionsEnabled: () => true,
  certification: "TEST electronic signing consent",
  proxyConfig: { campaignId: "test-only", templateVersion: "test-only-v1" },
}));
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/storage", () => ({
  putPrivate: vi.fn().mockResolvedValue(undefined),
  deletePrivate: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/db", () => {
  const tx = {
    $executeRaw: async (_sql: TemplateStringsArray, key: string) => {
      state.locks.push(key);
    },
    emailSigningSession: {
      updateMany: async ({
        where,
      }: {
        where: { tokenHash: string; email: string };
      }) => {
        if (
          state.proofConsumed ||
          where.tokenHash !== state.proofHash ||
          where.email !== "test@example.org"
        )
          return { count: 0 };
        state.proofConsumed = true;
        return { count: 1 };
      },
      findUniqueOrThrow: async () => ({
        id: "verified-session",
        verifiedAt: new Date(Date.now() - 1000),
      }),
    },
    proxySubmission: {
      findMany: async (args: {
        where: {
          houseNumber: { equals: string };
          street: string;
          templateVersion: { startsWith: string };
        };
      }) =>
        state.rows.filter(
          (s) =>
            s.houseNumber.toLowerCase() ===
              args.where.houseNumber.equals.toLowerCase() &&
            s.street === args.where.street &&
            s.templateVersion.startsWith(args.where.templateVersion.startsWith),
        ),
      create: async (args: {
        data: {
          id: string;
          houseNumber: string;
          street: string;
          likelyDuplicate: boolean;
          templateVersion: string;
        };
      }) => {
        state.rows.push(args.data);
      },
      updateMany: async (args: {
        where: { id: { in: string[] } };
        data: { likelyDuplicate: boolean };
      }) => {
        for (const row of state.rows)
          if (args.where.id.in.includes(row.id))
            row.likelyDuplicate = args.data.likelyDuplicate;
      },
    },
    auditEvent: {
      create: async (args: {
        data: { submissionId: string; eventType: string };
      }) => {
        state.events.push(args.data);
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
import { sha256 } from "@/lib/security/crypto";
import { sendEmail } from "@/lib/email";
import { createSubmission } from "@/lib/submissions";
let signature = "";
beforeEach(async () => {
  vi.stubEnv("OTP_PEPPER", "test-only-pepper-at-least-32-characters");
  state.proofConsumed = false;
  state.proofHash = sha256("verified-test-token");
  vi.mocked(sendEmail).mockClear();
  state.rows.length = 0;
  state.events.length = 0;
  state.locks.length = 0;
  const bytes = await sharp(
    Buffer.from(
      '<svg width="320" height="120"><path d="M10 80 Q100 10 160 90 T300 50" stroke="black" stroke-width="4" fill="none"/></svg>',
    ),
  )
    .png()
    .toBuffer();
  signature = `data:image/png;base64,${bytes.toString("base64")}`;
});
it("retains both same-property submissions and flags both with an audit event", async () => {
  const data = {
    houseNumber: "19123A",
    street: "NE 6th Avenue",
    firstName: "Test",
    lastName: "Signer",
    email: "test@example.org",
    ownershipType: "Individual" as const,
    signature,
    certified: true as const,
    turnstileToken: "test-only",
  };
  const a = await createSubmission(data, "test", "test");
  expect(state.rows[0].likelyDuplicate).toBe(false);
  const b = await createSubmission(
    { ...data, houseNumber: "19123a" },
    "test",
    "test",
  );
  expect(a.id).not.toBe(b.id);
  expect(state.rows).toHaveLength(2);
  expect(state.rows.every((s) => s.likelyDuplicate)).toBe(true);
  expect(state.events).toContainEqual(
    expect.objectContaining({
      submissionId: a.id,
      eventType: "LIKELY_DUPLICATE",
    }),
  );
  expect(state.locks[0]).toBe(state.locks[1]);
});
it("does not flag different properties as duplicates", async () => {
  const data = {
    houseNumber: "19123",
    street: "NE 6th Avenue",
    firstName: "Test",
    lastName: "Signer",
    email: "test@example.org",
    ownershipType: "Individual" as const,
    signature,
    certified: true as const,
    turnstileToken: "test-only",
  };
  await createSubmission(data, "test", "test");
  await createSubmission({ ...data, houseNumber: "19124" }, "test", "test");
  expect(state.rows.every((s) => !s.likelyDuplicate)).toBe(true);
});

it("does not flag a November property because it had an October proxy", async () => {
  state.rows.push({
    id: "old-campaign",
    houseNumber: "665",
    street: "NE 191st Street",
    likelyDuplicate: false,
    templateVersion: "old-october:hash",
  });
  await createSubmission(
    {
      houseNumber: "665",
      street: "NE 191st Street",
      firstName: "Test",
      lastName: "Signer",
      email: "test@example.org",
      ownershipType: "Individual",
      signature,
      certified: true,
      turnstileToken: "test-only",
    },
    "test",
    "test",
  );
  expect(state.rows.every((row) => !row.likelyDuplicate)).toBe(true);
});

it("records a signature only after consuming its verified mailbox proof", async () => {
  const data = {
    houseNumber: "665",
    street: "NE 191st Street",
    firstName: "Test",
    lastName: "Only",
    email: "test@example.org",
    ownershipType: "Individual" as const,
    signature,
    certified: true as const,
  };
  await createSubmission(
    data,
    "test",
    "test",
    undefined,
    "verified-test-token",
  );
  expect(state.rows[0].status).toBe("VERIFIED");
  expect(state.rows[0].verifiedAt!.getTime()).toBeLessThan(
    state.rows[0].signedAt!.getTime(),
  );
  expect(state.proofConsumed).toBe(true);
  expect(sendEmail).not.toHaveBeenCalled();
  await expect(
    createSubmission(data, "test", "test", undefined, "verified-test-token"),
  ).rejects.toThrow("Verify your email");
  expect(state.rows).toHaveLength(1);
});
