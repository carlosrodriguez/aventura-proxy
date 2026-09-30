import { test, expect, type Page } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
// Playwright modifies page props and mocks network responses only inside tests.
// Production API flags, OTP verification, and Turnstile checks remain intact.
async function start(page: Page) {
  await page.route("**/sign", async (route) => {
    const response = await route.fetch();
    const original = await response.text();
    const body = original.replace(/(enabled[^a-zA-Z]+)false/g, "$1true");
    if (body === original)
      throw new Error("Missing enabled flag in test-only page fixture");
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
  await page.goto("/sign");
  await page.getByLabel("House number").fill("19123");
  await page
    .getByLabel("Street", { exact: true })
    .selectOption("NE 6th Avenue");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("First name").fill("Test");
  await page.getByLabel("Last name").fill("Signer");
  await page.getByLabel("Email address").fill("test@example.org");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const box = await page.locator("canvas").boundingBox();
  if (!box) throw new Error("Signature missing");
  await page.mouse.move(box.x + 20, box.y + 100);
  await page.mouse.down();
  await page.mouse.move(box.x + 90, box.y + 50);
  await page.mouse.move(box.x + 180, box.y + 120);
  await page.mouse.up();
  await page.getByLabel("I certify", { exact: false }).check();
  await page.route("**/api/submissions", (route) =>
    route.fulfill({ json: { id: "test-only-submission", codeSent: true } }),
  );
  await page.getByRole("button", { name: "Send verification code" }).click();
}
test("OTP failure keeps the signer on verification", async ({ page }) => {
  await start(page);
  await page.route("**/api/proxy/verify", (route) =>
    route.fulfill({
      status: 400,
      json: {
        error: "Code could not be verified. Request a new code if needed.",
      },
    }),
  );
  await page.getByLabel("Verification code").fill("999999");
  await page.getByRole("button", { name: "Verify & finalize" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "Code could not be verified",
  );
  await expect(page.getByLabel("Verification code")).toBeVisible();
});
test("OTP expiration permits a resend", async ({ page }) => {
  await start(page);
  await page.route("**/api/proxy/verify", (route) =>
    route.fulfill({
      status: 400,
      json: {
        error: "Code could not be verified. Request a new code if needed.",
      },
    }),
  );
  let resent = false;
  await page.route("**/api/proxy/resend", (route) => {
    resent = true;
    return route.fulfill({ json: { ok: true } });
  });
  await page.getByLabel("Verification code").fill("012345");
  await page.getByRole("button", { name: "Verify & finalize" }).click();
  await page.getByRole("button", { name: "Resend code" }).click();
  await expect.poll(() => resent).toBe(true);
});
test("successful verification with mocked email and PDF download", async ({
  page,
}) => {
  await start(page);
  await page.route("**/api/proxy/verify", (route) =>
    route.fulfill({ json: { id: "test-only-submission" } }),
  );
  const pdf = await PDFDocument.create();
  pdf.addPage().drawText("TEST ONLY - NOT A VOTING DOCUMENT");
  const bytes = await pdf.save();
  await page.route("**/api/proxy/download", (route) =>
    route.fulfill({ json: { url: "http://localhost:3140/test-proxy.pdf" } }),
  );
  await page.route("**/test-proxy.pdf", (route) =>
    route.fulfill({
      contentType: "application/pdf",
      headers: {
        "Content-Disposition": 'attachment; filename="test-proxy.pdf"',
      },
      body: Buffer.from(bytes),
    }),
  );
  await page.getByLabel("Verification code").fill("012345");
  await page.getByRole("button", { name: "Verify & finalize" }).click();
  await expect(page.getByText("Your proxy has been finalized")).toBeVisible();
  await expect(
    page.getByText("Association validation is still required.", {
      exact: false,
    }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download signed proxy" }).click();
  expect((await download).suggestedFilename()).toBe("test-proxy.pdf");
});
