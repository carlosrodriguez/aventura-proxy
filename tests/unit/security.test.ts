import { describe, it, expect, vi } from "vitest";
import {
  propertySchema,
  signerSchema,
  submissionSchema,
} from "@/lib/validation/submission";
import {
  sha256,
  generateOtp,
  otpHash,
  checkOtp,
  otpUsable,
  transitionAllowed,
  duplicateKey,
} from "@/lib/security/crypto";
import { officialTemplateReady, submissionsEnabled } from "@/lib/config";
import { rateAllowed } from "@/lib/security/http";
const secret = "unit-test-pepper-with-at-least-32-characters";
describe("address format", () => {
  it("accepts configured streets", () =>
    expect(
      propertySchema.safeParse({
        houseNumber: "19123",
        street: "NE 6th Avenue",
      }).success,
    ).toBe(true));
  it.each(["", "0", "12<script>", "-1", "1234567"])(
    "rejects invalid house %s",
    (house) =>
      expect(
        propertySchema.safeParse({
          houseNumber: house,
          street: "NE 6th Avenue",
        }).success,
      ).toBe(false),
  );
  it("rejects unlisted street and owner lookup fields", () => {
    expect(
      propertySchema.safeParse({ houseNumber: "19123", street: "Unknown" })
        .success,
    ).toBe(false);
    expect(
      propertySchema.safeParse({
        houseNumber: "19123",
        street: "NE 6th Avenue",
        owner: "private",
      }).success,
    ).toBe(false);
  });
});
describe("signer", () => {
  const signer = {
    firstName: "Jane",
    lastName: "Owner",
    email: "jane@example.org",
    ownershipType: "Individual",
  };
  it("accepts signer", () =>
    expect(signerSchema.safeParse(signer).success).toBe(true));
  it("rejects invalid email", () =>
    expect(
      signerSchema.safeParse({ ...signer, email: "invalid" }).success,
    ).toBe(false));
  it("requires entity capacity", () =>
    expect(
      signerSchema.safeParse({ ...signer, ownershipType: "LLC" }).success,
    ).toBe(false));
  it("rejects missing certification and typed signature", () =>
    expect(
      submissionSchema.safeParse({
        ...signer,
        houseNumber: "19123",
        street: "NE 6th Avenue",
        signature: "Jane Owner",
        certified: false,
        turnstileToken: "token",
      }).success,
    ).toBe(false));
});
describe("OTP", () => {
  it("generates six-digit codes with secure randomness", () => {
    for (let i = 0; i < 100; i++) expect(generateOtp()).toMatch(/^\d{6}$/);
  });
  it("hashes with a submission-bound pepper and constant-time check", () => {
    const hash = otpHash("012345", "submission-a", secret);
    expect(hash).not.toContain("012345");
    expect(checkOtp("012345", "submission-a", hash, secret)).toBe(true);
    expect(checkOtp("999999", "submission-a", hash, secret)).toBe(false);
    expect(checkOtp("012345", "submission-b", hash, secret)).toBe(false);
  });
  it("enforces expiration boundary and attempt cap", () => {
    const now = new Date("2026-09-29T12:00:00Z");
    expect(otpUsable(new Date(now.getTime() + 1), 4, now)).toBe(true);
    expect(otpUsable(now, 0, now)).toBe(false);
    expect(otpUsable(new Date(now.getTime() + 1000), 5, now)).toBe(false);
  });
});
it("enforces the rate-limit boundary", () => {
  expect(rateAllowed(5, 5)).toBe(true);
  expect(rateAllowed(6, 5)).toBe(false);
});
it("generates a reproducible SHA-256 PDF-byte hash", () => {
  expect(sha256(Buffer.from("abc"))).toBe(
    "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
  );
  expect(sha256(Buffer.from("%PDF-1.7"))).not.toBe(
    sha256(Buffer.from("%PDF-1.7 modified")),
  );
});
it("requires ordered status transitions", () => {
  expect(transitionAllowed("SIGNED", "VERIFIED")).toBe(true);
  expect(transitionAllowed("VERIFIED", "FINALIZED")).toBe(true);
  expect(transitionAllowed("SIGNED", "FINALIZED")).toBe(false);
  expect(transitionAllowed("FINALIZED", "SIGNED")).toBe(false);
});
it("normalizes likely duplicate properties", () => {
  expect(duplicateKey(" 123A ", "NE 6th Avenue")).toBe(
    duplicateKey("123a", "ne 6th avenue"),
  );
  expect(duplicateKey("124", "NE 6th Avenue")).not.toBe(
    duplicateKey("123", "NE 6th Avenue"),
  );
});
it("refuses to enable an unreviewed template even with a true environment flag", () => {
  vi.stubEnv("ENABLE_SUBMISSIONS", "true");
  expect(officialTemplateReady()).toBe(false);
  expect(submissionsEnabled()).toBe(false);
  vi.unstubAllEnvs();
});
