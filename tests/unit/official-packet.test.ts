import { expect, it, vi } from "vitest";
import {
  proxyConfig,
  officialTemplateReady,
  submissionsEnabled,
  resolveProxyholderName,
  proxyholderReady,
} from "@/lib/config";

it("uses the membership meeting time, not the board meeting time", () => {
  expect(proxyConfig.meetingTime).toBe(
    "6:15pm, or immediately following the Special Board Meeting",
  );
  expect(proxyConfig.meetingLocation).toContain("605 NE 193 Street");
});
it("keeps NO instructions and uses the configurable named-proxyholder option", () => {
  expect(proxyConfig.proposals.map((p) => p.vote)).toEqual(["NO", "NO", "NO"]);
  expect(proxyConfig.proxyholderSelection).toBe("b");
  vi.stubEnv("PROXYHOLDER_NAME", "TBD");
  expect(proxyConfig.proxyholder).toBe("TBD");
  vi.unstubAllEnvs();
  expect(proxyConfig.importantProxyNote).toContain(
    "90 days after the date of the meeting",
  );
});
it("preserves amendment redlines without presenting deleted text as new text", () => {
  expect(proxyConfig.officialExhibits.A.sections[0].segments).toContainEqual({
    text: "OWNERS",
    change: "deleted",
  });
  expect(proxyConfig.officialExhibits.C.sections[0].segments).toContainEqual({
    text: "30%",
    change: "deleted",
  });
  expect(proxyConfig.officialExhibits.C.sections[0].segments).toContainEqual({
    text: "twenty percent (20%)",
    change: "added",
  });
});
it("does not enable submissions while Exhibit B and review remain outstanding", () => {
  vi.stubEnv("ENABLE_SUBMISSIONS", "true");
  expect(proxyConfig.officialExhibits.B.language).toBe(
    "[OFFICIAL EXHIBIT B LANGUAGE REQUIRED]",
  );
  expect(proxyConfig.reviewed).toBe(false);
  expect(officialTemplateReady()).toBe(false);
  expect(submissionsEnabled()).toBe(false);
  vi.unstubAllEnvs();
});

it("defaults unresolved names to TBD and blocks placeholder or invalid names", () => {
  expect(resolveProxyholderName("")).toBe("TBD");
  expect(resolveProxyholderName(" ")).toBe("TBD");
  for (const name of [
    "TBD",
    "tbd",
    "To be determined",
    "unknown",
    "",
    "A\nB",
    "A".repeat(161),
  ]) {
    expect(proxyholderReady(name)).toBe(false);
  }
  expect(resolveProxyholderName("A\nB")).toBe("TBD");
  expect(resolveProxyholderName("A".repeat(161))).toBe("TBD");
});
it("resolves the configured name into option b of the execution wording", () => {
  vi.stubEnv("PROXYHOLDER_NAME", "  Sample Attendee  ");
  expect(proxyConfig.proxyholder).toBe("Sample Attendee");
  expect(proxyholderReady()).toBe(true);
  expect(proxyConfig.executionProxyWording).toContain("(b) Sample Attendee,");
  vi.unstubAllEnvs();
});
