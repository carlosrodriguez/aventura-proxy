import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { originCheck, jsonBody, clientIp } from "@/lib/security/http";
import { csvCell } from "@/app/api/admin/submissions/route";

describe("request boundaries", () => {
  it("requires the exact configured origin and JSON", () => {
    vi.stubEnv("APP_URL", "https://proxy.example.org");
    const request = (origin: string, type = "application/json") =>
      new NextRequest("https://proxy.example.org/api/submissions", {
        method: "POST",
        headers: { origin, "Content-Type": type },
        body: "{}",
      });
    expect(() =>
      originCheck(request("https://proxy.example.org")),
    ).not.toThrow();
    expect(() =>
      originCheck(request("https://attacker.example.org")),
    ).toThrow();
    expect(() =>
      originCheck(request("https://proxy.example.org", "text/plain")),
    ).toThrow();
    vi.unstubAllEnvs();
  });
  it("bounds the streamed body even without Content-Length", async () => {
    const req = new NextRequest("https://proxy.example.org", {
      method: "POST",
      body: JSON.stringify({ signature: "x".repeat(500) }),
    });
    await expect(jsonBody(req, 100)).rejects.toMatchObject({ status: 413 });
  });
  it("rejects malformed JSON", async () => {
    const req = new NextRequest("https://proxy.example.org", {
      method: "POST",
      body: "not-json",
    });
    await expect(jsonBody(req)).rejects.toMatchObject({ status: 400 });
  });
  it("does not trust forwarded IPs unless ingress is configured", () => {
    const req = new NextRequest("https://proxy.example.org", {
      headers: { "x-forwarded-for": "192.0.2.1, 192.0.2.2" },
    });
    vi.stubEnv("TRUSTED_IP_HEADER", "");
    expect(clientIp(req)).toBe("unknown");
    vi.stubEnv("TRUSTED_IP_HEADER", "x-forwarded-for");
    expect(clientIp(req)).toBe("192.0.2.1");
    vi.unstubAllEnvs();
  });
  it("neutralizes spreadsheet formula injection and quotes CSV", () => {
    expect(
      csvCell('=HYPERLINK("https://example.org")').startsWith("\"'="),
    ).toBe(true);
    expect(csvCell('name,"quoted"')).toBe('"name,""quoted"""');
  });
});
