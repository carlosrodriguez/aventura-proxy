import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: 2,
  use: { baseURL: "http://localhost:3140", trace: "retain-on-failure" },
  projects: [
    {
      name: "mobile-chromium",
      use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" },
    },
    { name: "desktop-chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: [
    {
      command: "pnpm start --port 3140",
      url: "http://localhost:3140",
      reuseExistingServer: false,
      env: {
        ENABLE_SUBMISSIONS: "false",
        ENABLE_ADMIN: "false",
        APP_URL: "http://localhost:3140",
      },
      timeout: 120000,
    },
  ],
});
