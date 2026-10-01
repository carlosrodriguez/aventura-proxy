import { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { beforeEach, afterEach, it, expect } from "vitest";
import {
  ledgerVerificationSql,
  parseAuditCheckpoint,
  assertAuditCheckpoint,
} from "@/lib/security/audit-ledger";
let pg: PGlite;
const submissionId = randomUUID();
async function migration(name: string) {
  await pg.exec(
    await readFile(
      new URL(`../../prisma/migrations/${name}/migration.sql`, import.meta.url),
      "utf8",
    ),
  );
}
async function insertEvent(metadata = { certified: true }) {
  const id = randomUUID();
  await pg.query(
    `INSERT INTO "AuditEvent" ("id","submissionId","eventType","metadata") VALUES ($1,$2,'SIGNED',$3)`,
    [id, submissionId, JSON.stringify(metadata)],
  );
  return id;
}
async function ledger() {
  return (
    await pg.query<{
      sequence: bigint;
      previousHash: string;
      entryHash: string;
      payloadHash: string;
      operation: string;
    }>(`SELECT * FROM "AuditLedger" ORDER BY "sequence"`)
  ).rows;
}
async function verify() {
  return (await pg.query(ledgerVerificationSql)).rows;
}
beforeEach(async () => {
  pg = new PGlite();
  await migration("20260929000000_initial");
  await pg.query(
    `INSERT INTO "ProxySubmission" ("id","houseNumber","street","firstName","lastName","email","ownershipType","signedAt","ipAddress","userAgent","signatureRef","templateVersion","accessExpiresAt","accessTokenHash") VALUES ($1,'TEST','TEST','Test','Only','test@example.invalid','Individual',NOW(),'test','test','test','test',NOW(),'test')`,
    [submissionId],
  );
}, 30000);
afterEach(async () => {
  await pg.close();
});
it("seals historical events and chains future writes with stable canonical metadata", async () => {
  await insertEvent();
  await migration("20260930000000_audit_chain");
  await Promise.all([
    insertEvent({ certified: true }),
    insertEvent({ certified: true }),
  ]);
  const rows = await ledger();
  expect(rows).toHaveLength(3);
  expect(rows[0].previousHash).toBe("0".repeat(64));
  expect(rows[1].previousHash).toBe(rows[0].entryHash);
  expect(rows[2].previousHash).toBe(rows[1].entryHash);
  expect(await verify()).toEqual([]);
  await pg.exec(`SET TIME ZONE 'America/New_York'`);
  expect(await verify()).toEqual([]);
});
it("records retention deletion without retaining event contents or breaking the chain", async () => {
  await migration("20260930000000_audit_chain");
  await insertEvent();
  await pg.query(`DELETE FROM "ProxySubmission" WHERE "id"=$1`, [submissionId]);
  const rows = await ledger();
  expect(rows.map((r) => r.operation)).toEqual(["INSERT", "DELETE"]);
  expect(rows[0].payloadHash).toBe(rows[1].payloadHash);
  expect(await verify()).toEqual([]);
  expect((await pg.query(`SELECT * FROM "AuditEvent"`)).rows).toEqual([]);
});
it("rejects normal edits, ledger deletion, and truncation", async () => {
  await migration("20260930000000_audit_chain");
  const id = await insertEvent();
  await expect(
    pg.query(`UPDATE "AuditEvent" SET "metadata"='{}' WHERE "id"=$1`, [id]),
  ).rejects.toThrow("append-only");
  await expect(pg.exec(`DELETE FROM "AuditLedger"`)).rejects.toThrow(
    "append-only",
  );
  await expect(pg.exec(`TRUNCATE "AuditLedger"`)).rejects.toThrow(
    "append-only",
  );
  await expect(pg.exec(`TRUNCATE "AuditEvent"`)).rejects.toThrow("append-only");
});
it("detects changed source records even when a privileged user disables protection", async () => {
  await migration("20260930000000_audit_chain");
  const id = await insertEvent();
  await pg.exec(`ALTER TABLE "AuditEvent" DISABLE TRIGGER audit_no_update`);
  await pg.query(
    `UPDATE "AuditEvent" SET "metadata"='{"certified":false}' WHERE "id"=$1`,
    [id],
  );
  expect(await verify()).toContainEqual(
    expect.objectContaining({ problem: "event contents or deletion" }),
  );
});
it("detects an unlogged deletion and a changed ledger entry", async () => {
  await migration("20260930000000_audit_chain");
  const id = await insertEvent();
  await pg.exec(`ALTER TABLE "AuditEvent" DISABLE TRIGGER audit_capture`);
  await pg.query(`DELETE FROM "AuditEvent" WHERE "id"=$1`, [id]);
  expect(await verify()).toContainEqual(
    expect.objectContaining({ problem: "event contents or deletion" }),
  );
  await pg.exec(
    `ALTER TABLE "AuditLedger" DISABLE TRIGGER ledger_no_mutation; UPDATE "AuditLedger" SET "payloadHash"=repeat('a',64)`,
  );
  expect(await verify()).toContainEqual(
    expect.objectContaining({ problem: "chain" }),
  );
});
it("detects missing chain links; an external head is needed to detect tail removal", async () => {
  await migration("20260930000000_audit_chain");
  await insertEvent();
  await insertEvent();
  await insertEvent();
  const savedHead = (await ledger())[2];
  await pg.exec(
    `ALTER TABLE "AuditLedger" DISABLE TRIGGER ledger_no_mutation; DELETE FROM "AuditLedger" WHERE "sequence"=2`,
  );
  expect(await verify()).toContainEqual(
    expect.objectContaining({ problem: "chain" }),
  );
  const saved = await pg.query(
    `SELECT "entryHash" FROM "AuditLedger" WHERE "sequence"=$1`,
    [savedHead.sequence],
  );
  expect(saved.rows).toHaveLength(1);
  await pg.exec(`DELETE FROM "AuditLedger" WHERE "sequence"=3`);
  expect(
    (
      await pg.query(
        `SELECT "entryHash" FROM "AuditLedger" WHERE "sequence"=$1`,
        [savedHead.sequence],
      )
    ).rows,
  ).toHaveLength(0);
});

it("detects a valid prefix rollback against a saved external checkpoint", async () => {
  await migration("20260930000000_audit_chain");
  const a = await insertEvent();
  const b = await insertEvent();
  await pg.query(`DELETE FROM "AuditEvent" WHERE "id"=$1`, [b]);
  const rows = await ledger();
  const checkpoint = parseAuditCheckpoint({
    version: 1,
    sequence: String(rows[2].sequence),
    entryHash: rows[2].entryHash,
  });
  assertAuditCheckpoint(checkpoint, rows[2].entryHash);
  await pg.exec(
    `ALTER TABLE "AuditLedger" DISABLE TRIGGER ledger_no_mutation; DELETE FROM "AuditLedger" WHERE "sequence">1`,
  );
  // The remaining event and chain form a valid prefix; a saved head exposes the rollback.
  expect(await verify()).toEqual([]);
  const result = await pg.query<{ entryHash: string }>(
    `SELECT "entryHash" FROM "AuditLedger" WHERE "sequence"=$1`,
    [checkpoint.sequence],
  );
  expect(() =>
    assertAuditCheckpoint(checkpoint, result.rows[0]?.entryHash),
  ).toThrow("Checkpoint mismatch");
  expect(() =>
    parseAuditCheckpoint({
      version: 1,
      sequence: "oops",
      entryHash: rows[0].entryHash,
    }),
  ).toThrow("Invalid checkpoint");
  expect(a).not.toBe(b);
});
it("rolls back ledger entries with their source transaction", async () => {
  await migration("20260930000000_audit_chain");
  await pg.exec("BEGIN");
  await insertEvent();
  await pg.exec("ROLLBACK");
  expect(await ledger()).toEqual([]);
  await insertEvent();
  expect(String((await ledger())[0].sequence)).toBe("1");
  expect(await verify()).toEqual([]);
});
