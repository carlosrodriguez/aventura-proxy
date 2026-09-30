import { beforeEach, expect, it, vi } from "vitest";
import sharp from "sharp";
const state = vi.hoisted(() => ({
  rows: [] as Array<{
    id: string;
    houseNumber: string;
    street: string;
    likelyDuplicate: boolean;
  }>,
  events: [] as Array<{ submissionId: string; eventType: string }>,
  locks: [] as string[],
}));
vi.mock("@/lib/config", () => ({
  submissionsEnabled: () => true,
  certification: "TEST electronic signing consent",
  proxyConfig: { templateVersion: "test-only-v1" },
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
    proxySubmission: {
      findMany: async (args: {
        where: { houseNumber: { equals: string }; street: string };
      }) =>
        state.rows.filter(
          (s) =>
            s.houseNumber.toLowerCase() ===
              args.where.houseNumber.equals.toLowerCase() &&
            s.street === args.where.street,
        ),
      create: async (args: {
        data: {
          id: string;
          houseNumber: string;
          street: string;
          likelyDuplicate: boolean;
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
import { createSubmission } from "@/lib/submissions";
let signature = "";
beforeEach(async () => {
  vi.stubEnv("OTP_PEPPER", "test-only-pepper-at-least-32-characters");
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
