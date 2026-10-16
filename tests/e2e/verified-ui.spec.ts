import { test, expect, type Page } from "@playwright/test";
// Test-only network fixtures. The real API still requires Turnstile and mailbox proof.
async function start(page: Page) {
  await page.route("**/sign", async (route) => {
    const response = await route.fetch();
    const original = await response.text();
    const body = original.replace(/(enabled[^a-zA-Z]+)false/g, "$1true");
    if (body === original) throw new Error("Missing test enabled flag");
    await route.fulfill({ response, body });
  });
  await page.route(
    "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit",
    (route) =>
      route.fulfill({
        contentType: "application/javascript",
        body: 'window.turnstile={render:function(el,options){options.callback("test-only-token");return "test-widget";}};',
      }),
  );
  await page.route("**/api/email-verification/start", (route) =>
    route.fulfill({ json: { ok: true, nextResendAt: 0 } }),
  );
  await page.goto("/sign");
  await page.getByLabel("House number").fill("19123");
  await page
    .getByLabel("Street", { exact: true })
    .selectOption("NE 6th Avenue");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Signer");
  await page.getByLabel("Email address").fill("test@example.org");
  await page
    .getByRole("button", { name: "Send verification code", exact: true })
    .click();
  await expect(page.locator("canvas")).toHaveCount(0);
}
async function verify(page: Page) {
  await page.route("**/api/email-verification/verify", (route) =>
    route.fulfill({ json: { ok: true } }),
  );
  await page.getByLabel("Verification code").fill("012345");
  await page.getByRole("button", { name: "Verify email & continue" }).click();
}
async function sign(page: Page) {
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("Missing signature");
  await page.mouse.move(box.x + 20, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 50);
  await page.mouse.move(box.x + 180, box.y + 120);
  await page.mouse.up();
  await page.getByLabel("I certify", { exact: false }).check();
}
test("OTP failure keeps signing inaccessible", async ({ page }) => {
  await start(page);
  await page.route("**/api/email-verification/verify", (route) =>
    route.fulfill({
      status: 400,
      json: { error: "Code could not be verified" },
    }),
  );
  await page.getByLabel("Verification code").fill("999999");
  await page.getByRole("button", { name: "Verify email & continue" }).click();
  await expect(page.getByRole("alert")).toContainText("Code could not");
  await expect(page.locator("canvas")).toHaveCount(0);
});
test("resend is available before signing", async ({ page }) => {
  await start(page);
  let resent = false;
  await page.route("**/api/email-verification/resend", (route) => {
    resent = true;
    return route.fulfill({ json: { nextResendAt: Date.now() + 120000 } });
  });
  await page.getByRole("button", { name: "Resend code" }).click();
  await expect.poll(() => resent).toBe(true);
  await expect(page.locator("canvas")).toHaveCount(0);
});
test("verification unlocks signing but does not create a proxy", async ({
  page,
}) => {
  let created = false;
  await page.route("**/api/submissions", (route) => {
    created = true;
    return route.fulfill({ json: { id: "test-submission" } });
  });
  await start(page);
  await verify(page);
  await expect(
    page.getByRole("heading", { name: "Signature", exact: true }),
  ).toBeVisible();
  expect(created).toBe(false);
  await sign(page);
  await page.route("**/api/proxy/finalize", (route) =>
    route.fulfill({ json: { id: "test-submission" } }),
  );
  await page.getByRole("button", { name: "Sign and complete proxy" }).click();
  await expect(page.getByText("Your proxy has been finalized")).toBeVisible();
  expect(created).toBe(true);
});
test("email changes require verification again", async ({ page }) => {
  await start(page);
  await verify(page);
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByRole("button", { name: "Back", exact: true }).click();
  await page.getByLabel("Email address").fill("other@example.org");
  await expect(
    page.getByRole("button", { name: "Send verification code" }),
  ).toBeVisible();
  await expect(page.locator("canvas")).toHaveCount(0);
});
