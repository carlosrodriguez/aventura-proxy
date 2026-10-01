import { test, expect, type Page } from "@playwright/test";
async function property(page: Page) {
  await page.goto("/sign");
  await page.getByLabel("House number").fill("19123");
  await page
    .getByLabel("Street", { exact: true })
    .selectOption("NE 6th Avenue");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
async function signer(page: Page) {
  await property(page);
  await page.getByLabel("First name").fill("Jane");
  await page.getByLabel("Last name").fill("Example");
  await page.getByLabel("Email address").fill("jane@example.org");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
}
async function signature(page: Page) {
  await signer(page);
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const canvas = page.locator("canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Missing signature canvas");
  await page.mouse.move(box.x + 20, box.y + 100);
  await page.mouse.down();
  for (let i = 1; i < 20; i++)
    await page.mouse.move(box.x + 20 + i * 7, box.y + 100 + Math.sin(i) * 15);
  await page.mouse.up();
  await page.getByLabel("I certify", { exact: false }).check();
}
test("complete draft flow never sends data or generates a voting document", async ({
  page,
}) => {
  const mutations: string[] = [];
  page.on("request", (req) => {
    if (req.method() === "POST") mutations.push(req.url());
  });
  await signature(page);
  await page.getByRole("button", { name: "Continue preview" }).click();
  await expect(
    page.getByText("No verification code was sent.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Preview completion" }).click();
  await expect(
    page.getByRole("heading", { name: "Preview complete" }),
  ).toBeVisible();
  expect(mutations).toEqual([]);
});
test("invalid property input", async ({ page }) => {
  await page.goto("/sign");
  await page.getByLabel("House number").fill("bad");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("valid house number");
});
test("invalid email", async ({ page }) => {
  await property(page);
  await page.getByLabel("First name").fill("Jane");
  await page.getByLabel("Last name").fill("Example");
  await page.getByLabel("Email address").fill("invalid");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});
test("submissions-disabled server safeguard", async ({ request }) => {
  for (const url of [
    "/api/submissions",
    "/api/proxy/verify",
    "/api/proxy/finalize",
    "/api/proxy/resend",
  ]) {
    const response = await request.post(url, {
      data: {},
      headers: { Origin: "http://localhost:3140" },
    });
    expect(response.status()).toBe(403);
    expect(await response.json()).toHaveProperty("error");
  }
});
test("admin hidden and security headers present", async ({ request }) => {
  expect((await request.get("/admin")).status()).toBe(404);
  const res = await request.get("/sign");
  expect(res.headers()["content-security-policy"]).toContain(
    "frame-ancestors 'none'",
  );
  expect(res.headers()["cache-control"]).toContain("no-store");
});
