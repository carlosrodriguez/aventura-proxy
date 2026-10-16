import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/lib/submissions", () => ({
  assertEnabled: () => {},
  createSubmission: state.create,
}));
vi.mock("@/lib/email", () => ({ deferEmail: async () => {} }));
vi.mock("@/lib/email-verification", () => ({
  requireVerifiedEmail: async (token: string | undefined, email: string) => {
    if (token !== "verified-cookie" || email !== "owner@example.org")
      throw new Error("no-proof");
  },
}));
vi.mock("@/lib/security/http", async (original) => {
  const actual = await original<typeof import("@/lib/security/http")>();
  return {
    ...actual,
    originCheck: () => {},
    rateLimit: async () => {},
    failure: () =>
      new Response(JSON.stringify({ error: "Email verification required" }), {
        status: 401,
      }),
  };
});
import { POST } from "@/app/api/submissions/route";
const payload = {
  houseNumber: "665",
  street: "NE 191st Street",
  firstName: "Test",
  lastName: "Only",
  email: "owner@example.org",
  ownershipType: "Individual",
  signature: "data:image/png;base64,AAAA",
  certified: true,
};
beforeEach(() =>
  state.create
    .mockReset()
    .mockResolvedValue({
      id: "test-submission",
      token: "access-token",
      codeSent: true,
    }),
);
function request(cookie?: string, email = "owner@example.org") {
  return new NextRequest("http://localhost:3140/api/submissions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: `proxy_email=${cookie}` } : {}),
    },
    body: JSON.stringify({ ...payload, email }),
  });
}
it("does not accept a signature without verified-email credentials", async () => {
  expect((await POST(request())).status).toBe(401);
  expect(state.create).not.toHaveBeenCalled();
});
it("does not let a verified cookie sign for a different email", async () => {
  expect(
    (await POST(request("verified-cookie", "other@example.org"))).status,
  ).toBe(401);
  expect(state.create).not.toHaveBeenCalled();
});
it("passes the mailbox proof into the signed-submission transaction and sets private access", async () => {
  const res = await POST(request("verified-cookie"));
  expect(res.status).toBe(200);
  expect(state.create.mock.calls[0][4]).toBe("verified-cookie");
  expect(res.headers.get("set-cookie")).toContain("proxy_access=access-token");
  expect(res.headers.get("set-cookie")).toContain("HttpOnly");
});
