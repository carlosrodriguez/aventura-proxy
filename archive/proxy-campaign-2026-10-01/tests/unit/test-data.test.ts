import { afterEach, expect, it, vi } from "vitest";
import { testDataToolsEnabled } from "@/lib/admin/test-data";
afterEach(() => vi.unstubAllEnvs());
it("allows tools only on the explicitly enabled dev test environment", () => {
  vi.stubEnv("ENABLE_TEST_DATA_TOOLS", "true");
  vi.stubEnv("PROXY_TEST_MODE", "true");
  vi.stubEnv("APP_URL", "https://dev.aventuraislesproxy.com");
  expect(testDataToolsEnabled()).toBe(true);
  vi.stubEnv("APP_URL", "https://aventuraislesproxy.com");
  expect(testDataToolsEnabled()).toBe(false);
  vi.stubEnv("APP_URL", "https://dev.aventuraislesproxy.com");
  vi.stubEnv("PROXY_TEST_MODE", "false");
  expect(testDataToolsEnabled()).toBe(false);
  vi.stubEnv("PROXY_TEST_MODE", "true");
  vi.stubEnv("ENABLE_TEST_DATA_TOOLS", "false");
  expect(testDataToolsEnabled()).toBe(false);
});
