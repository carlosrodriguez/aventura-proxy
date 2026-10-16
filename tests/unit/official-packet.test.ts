import { afterEach, expect, it, vi } from "vitest";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { PDFDocument } from "pdf-lib";
import {
  proxyConfig,
  officialTemplateReady,
  submissionsEnabled,
  resolveProxyholderName,
  proxyholderReady,
} from "@/lib/config";
import { fillOfficialProxy } from "@/lib/pdf/proxy";
afterEach(() => vi.unstubAllEnvs());
it("uses the annual membership meeting rather than the budget meeting", () => {
  expect(proxyConfig.meetingDate).toBe("November 17, 2026");
  expect(proxyConfig.meetingTime).toBe("6:15 PM");
  expect(proxyConfig.meetingLocation).toContain("605 NE 193 Street");
  expect(proxyConfig.officialProxyWording).toContain("establishing a quorum");
  expect(proxyConfig.officialProxyWording).not.toContain("LIMITED POWERS");
  expect(proxyConfig.importantProxyNote).toContain("ninety (90) days");
});
it("pins the complete official packet and outputs only its proxy page", async () => {
  vi.stubEnv("PROXYHOLDER_NAME", "Jenny Ghetea");
  const packet = await readFile("public/documents/annual-meeting-2026.pdf");
  expect(createHash("sha256").update(packet).digest("hex")).toBe(
    proxyConfig.proxyTemplateSha256,
  );
  const result = await fillOfficialProxy(
    packet,
    {
      id: "test-only",
      houseNumber: "665",
      street: "NE 191st Street",
      firstName: "TEST",
      lastName: "ONLY",
      entityName: null,
      signerTitle: null,
      signedAt: new Date("2026-10-15T16:00:00Z"),
      templateVersion: proxyConfig.templateVersion,
    },
    null,
  );
  const pdf = await PDFDocument.load(result);
  expect(pdf.getPageCount()).toBe(1);
  expect(pdf.getPage(0).getSize()).toEqual({ width: 612, height: 792 });
});
it("refuses a different packet shape rather than filling an unrelated form", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  await expect(
    fillOfficialProxy(await pdf.save(), {} as never, null),
  ).rejects.toThrow("five-page");
});
it("uses option b and still blocks unresolved proxyholders", () => {
  expect(proxyConfig.proxyholderSelection).toBe("b");
  vi.stubEnv("PROXYHOLDER_NAME", "  Jenny Ghetea  ");
  expect(proxyConfig.executionProxyWording).toContain("(X) (b) Jenny Ghetea,");
  vi.stubEnv("PROXYHOLDER_NAME", "TBD");
  expect(officialTemplateReady()).toBe(false);
  expect(submissionsEnabled()).toBe(false);
  for (const name of ["TBD", "unknown", "", "A\nB", "A".repeat(161)])
    expect(proxyholderReady(name)).toBe(false);
  expect(resolveProxyholderName("")).toBe("TBD");
});
