import { beforeEach, afterEach, it, expect, vi } from "vitest";
const state = vi.hoisted(() => ({
  send: vi.fn(),
  jobs: [] as Array<() => Promise<void>>,
}));
vi.mock("next/server", () => ({
  after: (task: () => Promise<void>) => {
    state.jobs.push(task);
  },
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: state.send };
  },
}));
import { deferEmail, transactionalEmail } from "@/lib/email";
beforeEach(() => {
  state.jobs.length = 0;
  state.send.mockReset();
  vi.stubEnv("RESEND_API_KEY", "test-key");
  vi.stubEnv("EMAIL_FROM", "test@example.org");
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});
it("defers sends through the Next lifecycle and preserves idempotency", async () => {
  state.send.mockResolvedValue({ data: { id: "test" }, error: null });
  await deferEmail(() =>
    transactionalEmail(
      "recipient@example.org",
      "Test",
      "Test only",
      "test-key",
    ),
  );
  expect(state.send).not.toHaveBeenCalled();
  await state.jobs[0]();
  expect(state.send).toHaveBeenCalledTimes(1);
  expect(state.send.mock.calls[0][1]).toEqual({ idempotencyKey: "test-key" });
});
it("logs provider failures without exposing recipient or payload and does not reject the background task", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  state.send.mockRejectedValue(new Error("sensitive provider payload"));
  await deferEmail(() =>
    transactionalEmail(
      "recipient@example.org",
      "Test",
      "Test only",
      "test-key",
    ),
  );
  await expect(state.jobs[0]()).resolves.toBeUndefined();
  expect(log.mock.calls).toEqual([
    ["transactional_email_send_failed"],
    ["transactional_email_background_failed"],
  ]);
});
it("records Resend API rejections as failures", async () => {
  const log = vi.spyOn(console, "error").mockImplementation(() => {});
  state.send.mockResolvedValue({
    error: { name: "validation_error", message: "private details" },
  });
  await expect(
    transactionalEmail(
      "recipient@example.org",
      "Test",
      "Test only",
      "test-key",
    ),
  ).rejects.toThrow("Email delivery failed");
  expect(log).toHaveBeenCalledWith("transactional_email_send_failed");
});
it("routes all dev messages to the test inbox and labels them", async () => {
  vi.stubEnv("EMAIL_RECIPIENT_OVERRIDE", "dev-inbox@example.org");
  vi.stubEnv("PROXY_TEST_MODE", "true");
  state.send.mockResolvedValue({ data: { id: "test" }, error: null });
  await transactionalEmail("owner@example.org", "Verification", "Code", "dev-test");
  expect(state.send.mock.calls[0][0]).toMatchObject({
    to: "dev-inbox@example.org", subject: "[DEV TEST] Verification",
  });
});
