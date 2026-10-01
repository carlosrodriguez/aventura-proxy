import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { beforeAll, afterAll, it, expect, vi } from "vitest";
import { sha256 } from "@/lib/security/crypto";
const state = vi.hoisted(() => ({ database: null as PGlite | null }));
vi.mock("@/lib/db", () => ({
  db: () => ({
    $queryRaw: async (strings: TemplateStringsArray, ...values: unknown[]) => {
      const sql = strings.reduce(
        (acc, s, i) => acc + s + (i < values.length ? `$${i + 1}` : ""),
        "",
      );
      return (await state.database!.query(sql, values)).rows;
    },
  }),
}));
import { rateLimit } from "@/lib/security/http";
beforeAll(async () => {
  state.database = new PGlite();
  await state.database.exec(
    await readFile(
      new URL(
        "../../prisma/migrations/20260929000000_initial/migration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
}, 30000);
afterAll(async () => {
  await state.database?.close();
});
it("initial PostgreSQL migration creates submission, audit, verification and auth tables", async () => {
  const result = await state.database!.query<{ table_name: string }>(
    `SELECT table_name FROM information_schema.tables WHERE table_schema='public'`,
  );
  expect(result.rows.map((r) => r.table_name)).toEqual(
    expect.arrayContaining([
      "ProxySubmission",
      "EmailVerification",
      "AuditEvent",
      "RateLimit",
      "AdminSession",
      "AdminChallenge",
    ]),
  );
});
it("executes shared rate limits against PostgreSQL SQL and resets expired windows", async () => {
  const key = "database-test";
  for (let i = 0; i < 3; i++) await rateLimit(key, 3, 600);
  await expect(rateLimit(key, 3, 600)).rejects.toMatchObject({ status: 429 });
  await state.database!.query(
    `UPDATE "RateLimit" SET "resetAt"=NOW()-INTERVAL '1 second' WHERE "key"=$1`,
    [sha256(key)],
  );
  await rateLimit(key, 3, 600);
  const result = await state.database!.query<{ count: number }>(
    `SELECT "count" FROM "RateLimit" WHERE "key"=$1`,
    [sha256(key)],
  );
  expect(result.rows[0].count).toBe(1);
});
it("separates limiter keys and enforces concurrent increments", async () => {
  const result = await Promise.allSettled(
    Array.from({ length: 8 }, () => rateLimit("concurrent-test", 5, 600)),
  );
  expect(result.filter((r) => r.status === "fulfilled")).toHaveLength(5);
  expect(result.filter((r) => r.status === "rejected")).toHaveLength(3);
  await expect(rateLimit("separate-key", 1, 600)).resolves.toBeUndefined();
});
it("adds independent receipt, print, and filing timestamps without changing existing records", async () => {
  await state.database!.exec(
    await readFile(
      new URL(
        "../../prisma/migrations/20260930010000_proxy_handoff/migration.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const result = await state.database!.query<{ column_name: string }>(
    `SELECT column_name FROM information_schema.columns WHERE table_name='ProxySubmission'`,
  );
  expect(result.rows.map((r) => r.column_name)).toEqual(
    expect.arrayContaining([
      "holderReceivedAt",
      "printedAt",
      "filedAt",
      "associationSentAt",
      "deliveredAt",
    ]),
  );
});
