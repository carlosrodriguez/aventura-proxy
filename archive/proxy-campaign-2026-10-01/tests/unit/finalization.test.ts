import { beforeEach, describe, it, expect, vi } from "vitest";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { sha256, otpHash } from "@/lib/security/crypto";
const state = vi.hoisted(() => ({
  row: {
    id: "11111111-1111-4111-8111-111111111111",
    houseNumber: "19123",
    street: "NE 6th Avenue",
    firstName: "Test",
    lastName: "Signer",
    email: "test@example.org",
    entityName: null,
    signerTitle: null,
    accessExpiresAt: new Date(Date.now() + 3600000),
    accessTokenHash: "fixture-access",
    signedAt: new Date("2026-09-29T12:00:00Z"),
    verifiedAt: null as Date | null,
    status: "SIGNED",
    templateVersion: "test-reviewed-v1",
    signatureRef: "fixture/signature.png",
    finalPdfRef: null as string | null,
    auditRef: null as string | null,
    pdfSha256: null as string | null,
    finalizedAt: null as Date | null,
    receiptSentAt: null as Date | null,
    associationSentAt: null as Date | null,
    ipAddress: "test",
    userAgent: "test",
    timezone: "America/New_York",
    verification: {
      codeHash: "",
      expiresAt: new Date(),
      attempts: 0,
      sentAt: new Date(),
      verifiedAt: null as Date | null,
    },
  },
  proxyholder: "TEST PROXYHOLDER",
  files: new Map<string, Uint8Array>(),
  events: [] as Array<{ eventType: string; metadata: unknown }>,
  mail: vi.fn(),
}));
vi.mock("@/lib/config", () => ({
  submissionsEnabled: () => true,
  officialTemplateReady: () => true,
  authorityNotice: "Email verification is not proof of property ownership.",
  proxyConfig: {
    association: "TEST ASSOCIATION - NOT AN OFFICIAL VOTING DOCUMENT",
    meetingDate: "TEST MEETING",
    meetingTime: "TEST TIME",
    meetingLocation: "TEST LOCATION",
    get proxyholder() {
      return state.proxyholder;
    },
    officialProxyWording: "TEST FIXTURE ONLY - NOT LEGAL PROXY WORDING",
    templateVersion: "test-reviewed-v1",
    proposals: [
      { label: "Exhibit A", vote: "NO", language: "TEST A" },
      { label: "Exhibit B", vote: "NO", language: "TEST B" },
      { label: "Exhibit C", vote: "NO", language: "TEST C" },
    ],
  },
}));
vi.mock("@/lib/storage", () => ({
  putPrivate: async (k: string, b: Uint8Array) => {
    state.files.set(k, b);
  },
  readPrivate: async (k: string) => {
    const bytes = state.files.get(k);
    if (!bytes) throw new Error("Missing test object");
    return bytes;
  },
  deletePrivate: async (k: string) => {
    state.files.delete(k);
  },
}));
vi.mock("@/lib/email", () => ({
  sendEmail: state.mail,
  receiptText: () => "TEST RECEIPT",
}));
vi.mock("@/lib/db", () => {
  const tx = {
    $executeRaw: async () => 1,
    proxySubmission: {
      findUniqueOrThrow: async () => ({
        ...state.row,
        verification: { ...state.row.verification },
      }),
      update: async (args: { data: Partial<typeof state.row> }) =>
        Object.assign(state.row, args.data),
    },
    emailVerification: {
      upsert: async (args: {
        update: Partial<typeof state.row.verification>;
      }) => Object.assign(state.row.verification, args.update),
      updateMany: async (args: {
        data: Partial<typeof state.row.verification>;
      }) => Object.assign(state.row.verification, args.data),
      update: async (args: {
        data: {
          attempts?: { increment: number };
          verifiedAt?: Date;
          codeHash?: string;
        };
      }) => {
        if (args.data.attempts)
          state.row.verification.attempts += args.data.attempts.increment;
        if (args.data.verifiedAt)
          state.row.verification.verifiedAt = args.data.verifiedAt;
        if (args.data.codeHash)
          state.row.verification.codeHash = args.data.codeHash;
      },
    },
    auditEvent: {
      count: async () =>
        state.events.filter((e) => e.eventType === "CODE_REISSUED").length,
      create: async (args: {
        data: { eventType: string; metadata: unknown };
      }) => state.events.push(args.data),
    },
  };
  return {
    db: () => ({
      ...tx,
      $transaction: async (fn: (t: typeof tx) => Promise<unknown>) => fn(tx),
    }),
  };
});
vi.mock("@/lib/pdf/proxy", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/pdf/proxy")>();
  return {
    ...original,
    generateProxy: async (
      details: import("@/lib/pdf/proxy").ProxyDetails,
      signature: Uint8Array,
    ) => {
      const fixture = await PDFDocument.create();
      fixture.addPage([780, 1000]);
      return original.fillOfficialProxy(
        await fixture.save(),
        details,
        signature,
      );
    },
  };
});
import {
  verifySubmission,
  finalizeSubmission,
  executionTemplateVersion,
} from "@/lib/submissions";
beforeEach(async () => {
  state.proxyholder = "TEST PROXYHOLDER";
  vi.stubEnv("OTP_PEPPER", "test-pepper-32-characters-minimum-length");
  vi.stubEnv("PROXY_DELIVERY_EMAIL", "");
  Object.assign(state.row, {
    status: "SIGNED",
    accessExpiresAt: new Date(Date.now() + 3600000),
    verifiedAt: null,
    finalizedAt: null,
    finalPdfRef: null,
    auditRef: null,
    pdfSha256: null,
    receiptSentAt: null,
    associationSentAt: null,
    templateVersion: executionTemplateVersion(),
  });
  Object.assign(state.row.verification, {
    codeHash: otpHash("012345", state.row.id),
    expiresAt: new Date(Date.now() + 600000),
    attempts: 0,
    verifiedAt: null,
    sentAt: new Date(),
  });
  state.events.length = 0;
  state.files.clear();
  state.mail.mockReset();
  const png = await sharp(
    Buffer.from(
      '<svg width="320" height="120"><path d="M20 60 Q60 10 100 80 T200 50" stroke="black" stroke-width="3" fill="none"/></svg>',
    ),
  )
    .png()
    .toBuffer();
  state.files.set("fixture/signature.png", png);
});
describe("server-side verification and PDF finalization", () => {
  it("finalizes without waiting for deferred mail and keeps failed receipt retryable", async () => {
    const pending: Array<() => Promise<void>> = [];
    await verifySubmission(state.row.id, "012345", async (task) => {
      pending.push(task);
    });
    expect(state.row.status).toBe("FINALIZED");
    expect(state.mail).not.toHaveBeenCalled();
    state.mail.mockRejectedValueOnce(new Error("provider unavailable"));
    await expect(pending[0]()).rejects.toThrow("Email delivery failed");
    expect(state.row.receiptSentAt).toBeNull();
    expect(
      state.events.some((e) => e.eventType === "RECEIPT_DELIVERY_FAILED"),
    ).toBe(true);
    state.mail.mockResolvedValue(undefined);
    await finalizeSubmission(state.row.id);
    expect(state.row.receiptSentAt).not.toBeNull();
  });
  it("rejects a proxyholder change after signing", async () => {
    state.row.status = "VERIFIED";
    state.row.verifiedAt = new Date();
    const signedVersion = state.row.templateVersion;
    state.proxyholder = "OTHER TEST PROXYHOLDER";
    expect(executionTemplateVersion()).not.toBe(signedVersion);
    await expect(finalizeSubmission(state.row.id)).rejects.toThrow();
    expect(state.row.finalPdfRef).toBeNull();
    expect(state.mail).not.toHaveBeenCalled();
  });
  it("rejects a wrong OTP and records the attempt without finalizing", async () => {
    await expect(verifySubmission(state.row.id, "999999")).rejects.toThrow(
      "Code could not be verified",
    );
    expect(state.row.verification.attempts).toBe(1);
    expect(state.row.status).toBe("SIGNED");
    expect(state.mail).not.toHaveBeenCalled();
  });
  it("rejects expired OTPs", async () => {
    state.row.verification.expiresAt = new Date(Date.now() - 1);
    await expect(verifySubmission(state.row.id, "012345")).rejects.toThrow(
      "Code could not be verified",
    );
    expect(state.row.status).toBe("SIGNED");
  });
  it("locks after five incorrect attempts", async () => {
    for (let i = 0; i < 5; i++)
      await expect(verifySubmission(state.row.id, "999999")).rejects.toThrow();
    await expect(verifySubmission(state.row.id, "012345")).rejects.toThrow();
    expect(state.row.verification.attempts).toBe(5);
  });
  it("verifies with mocked email and generates a real PDF plus separate hash envelope", async () => {
    await verifySubmission(state.row.id, "012345");
    expect(state.row.status).toBe("FINALIZED");
    expect(state.row.verification.codeHash).toBe("consumed");
    const bytes = state.files.get(state.row.finalPdfRef!)!;
    const pdf = await PDFDocument.load(bytes);
    expect(pdf.getPageCount()).toBeGreaterThan(0);
    expect(state.row.pdfSha256).toBe(sha256(bytes));
    const envelope = JSON.parse(
      Buffer.from(state.files.get(state.row.auditRef!)!).toString(),
    ) as { pdfSha256: string; ownershipAuthenticated: boolean };
    expect(envelope.pdfSha256).toBe(state.row.pdfSha256);
    expect(envelope.ownershipAuthenticated).toBe(false);
    expect(state.mail).toHaveBeenCalledTimes(1);
  });
  it("does not finalize unverified submissions", async () => {
    await expect(finalizeSubmission(state.row.id)).rejects.toThrow(
      "Verification required",
    );
    expect(state.files.size).toBe(1);
  });
  it("retries a finalized receipt without regenerating or editing the PDF", async () => {
    state.mail.mockRejectedValueOnce(new Error("email outage"));
    await expect(verifySubmission(state.row.id, "012345")).rejects.toThrow(
      "Email delivery failed",
    );
    const bytes = state.files.get(state.row.finalPdfRef!),
      hash = state.row.pdfSha256;
    await finalizeSubmission(state.row.id);
    expect(state.files.get(state.row.finalPdfRef!)).toBe(bytes);
    expect(state.row.pdfSha256).toBe(hash);
    expect(
      state.events.filter((e) => e.eventType === "FINALIZED"),
    ).toHaveLength(1);
  });
  it("refuses to finalize a signature bound to a replaced template", async () => {
    state.row.status = "VERIFIED";
    state.row.verifiedAt = new Date();
    state.row.templateVersion = "old-version";
    await expect(finalizeSubmission(state.row.id)).rejects.toThrow(
      "Template changed",
    );
  });
});

describe("draft editing and code resend protections", () => {
  it("enforces progressive 30-second, 2-minute, and 10-minute resend waits", async () => {
    const { resendOtp } = await import("@/lib/submissions");
    await expect(resendOtp(state.row.id)).rejects.toThrow("Please wait");
    state.row.verification.sentAt = new Date(Date.now() - 31000);
    const first = await resendOtp(state.row.id);
    expect(first.nextResendAt - state.row.verification.sentAt.getTime()).toBe(
      120000,
    );
    const oldHash = state.row.verification.codeHash;
    await expect(resendOtp(state.row.id)).rejects.toThrow("Please wait");
    state.row.verification.sentAt = new Date(Date.now() - 121000);
    const second = await resendOtp(state.row.id);
    expect(second.nextResendAt - state.row.verification.sentAt.getTime()).toBe(
      600000,
    );
    expect(state.row.verification.codeHash).not.toBe(oldHash);
    state.row.verification.sentAt = new Date(Date.now() - 121000);
    await expect(resendOtp(state.row.id)).rejects.toThrow("Please wait");
    state.row.verification.sentAt = new Date(Date.now() - 601000);
    await resendOtp(state.row.id);
    expect(state.mail).toHaveBeenCalledTimes(3);
  });
  it("preserves a restarted draft but invalidates access and its verification code", async () => {
    const { restartSubmission, verifySubmission, resendOtp } =
      await import("@/lib/submissions");
    await restartSubmission(state.row.id);
    expect(state.row.status).toBe("SIGNED");
    expect(state.events.some((e) => e.eventType === "DRAFT_RESTARTED")).toBe(
      true,
    );
    await expect(verifySubmission(state.row.id, "012345")).rejects.toThrow(
      "Access unavailable",
    );
    await expect(resendOtp(state.row.id)).rejects.toThrow("Access unavailable");
    expect(state.files.has("fixture/signature.png")).toBe(true);
  });
  it("prevents editing finalized proxies", async () => {
    const { restartSubmission } = await import("@/lib/submissions");
    state.row.status = "FINALIZED";
    await expect(restartSubmission(state.row.id)).rejects.toThrow(
      "can no longer be edited",
    );
  });
});
