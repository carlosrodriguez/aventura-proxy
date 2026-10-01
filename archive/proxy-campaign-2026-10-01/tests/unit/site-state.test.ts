import { afterEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { submissionsEnabled } from "@/lib/config";
afterEach(() => vi.unstubAllEnvs());
it("redirects public signing to the canonical closed page behind a proxy", () => {
  vi.stubEnv("SITE_STATE", "closed");
  vi.stubEnv("APP_URL", "https://aventuraislesproxy.com");
  const res = proxy(new NextRequest("https://localhost:8080/sign?lang=es"));
  expect(res.headers.get("location")).toBe(
    "https://aventuraislesproxy.com/closed?lang=es",
  );
});
it("blocks direct collection APIs while keeping health and admin authentication available", () => {
  vi.stubEnv("SITE_STATE", "closed");
  expect(
    proxy(new NextRequest("https://example.org/api/submissions")).status,
  ).toBe(503);
  expect(
    proxy(new NextRequest("https://example.org/api/proxy/finalize")).status,
  ).toBe(503);
  expect(proxy(new NextRequest("https://example.org/api/health")).status).toBe(
    200,
  );
  expect(
    proxy(new NextRequest("https://example.org/api/admin/login")).status,
  ).toBe(200);
  expect(submissionsEnabled()).toBe(false);
});
it("leaves dev public pages available in the open state", () => {
  vi.stubEnv("SITE_STATE", "open");
  expect(
    proxy(
      new NextRequest("https://dev.aventuraislesproxy.com/sign"),
    ).headers.get("location"),
  ).toBeNull();
});
