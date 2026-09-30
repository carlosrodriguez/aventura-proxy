import { beforeEach, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const state = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  findUnique: vi.fn(),
  update: vi.fn(),
  create: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/security/admin", () => ({ requireAdmin: state.requireAdmin }));
vi.mock("@/lib/db", () => ({
  db: () => ({
    proxySubmission: { findUnique: state.findUnique, update: state.update },
    auditEvent: { create: state.create },
    $transaction: state.transaction,
  }),
}));
vi.mock("@/lib/submissions", () => ({
  event: vi.fn(),
  deliverReceipt: vi.fn(),
}));
vi.mock("@/lib/storage", () => ({ temporaryUrl: vi.fn() }));
import { POST } from "@/app/api/admin/submissions/route";
const id = "11741863-2a51-484c-9c19-f8ab39a232a5";
function request(action: string) {
  return new NextRequest("https://test.example/api/admin/submissions", {
    method: "POST",
    headers: {
      origin: "https://test.example",
      "content-type": "application/json",
    },
    body: JSON.stringify({ id, action }),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("APP_URL", "https://test.example");
  state.requireAdmin.mockResolvedValue({ email: "operator@example.org" });
  state.findUnique.mockResolvedValue({
    id,
    status: "FINALIZED",
    associationStatus: "pending",
    holderReceivedAt: null,
    printedAt: null,
    filedAt: null,
  });
  state.update.mockResolvedValue({});
  state.create.mockResolvedValue({});
  state.transaction.mockResolvedValue([]);
});
it.each([
  ["received", "holderReceivedAt", "HOLDER_RECEIPT_CONFIRMED"],
  ["printed", "printedAt", "PRINT_CONFIRMED"],
  ["filed", "filedAt", "FILING_CONFIRMED"],
])(
  "records %s separately from email sending and acceptance",
  async (action, field, eventType) => {
    const response = await POST(request(action));
    expect(response.status).toBe(200);
    expect(state.update.mock.calls[0][0].data).toEqual({
      [field]: expect.any(Date),
    });
    expect(state.create.mock.calls[0][0].data).toMatchObject({
      eventType,
      metadata: { admin: "operator@example.org" },
    });
  },
);
it("does not mark an unfinished proxy as printed", async () => {
  state.findUnique.mockResolvedValue({ status: "SIGNED" });
  expect((await POST(request("printed"))).status).toBe(409);
  expect(state.update).not.toHaveBeenCalled();
});
it("requires admin authentication for receipt confirmation", async () => {
  state.requireAdmin.mockRejectedValue(new Error("Access unavailable"));
  expect((await POST(request("received"))).status).not.toBe(200);
  expect(state.update).not.toHaveBeenCalled();
});
it("preserves the original print confirmation timestamp", async () => {
  const date = new Date("2026-09-30T10:00:00Z");
  state.findUnique.mockResolvedValue({ status: "FINALIZED", printedAt: date });
  expect((await POST(request("printed"))).status).toBe(200);
  expect(state.update.mock.calls[0][0].data).toEqual({ printedAt: date });
});
