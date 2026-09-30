export type AuditCheckpoint = {
  version: 1;
  sequence: string;
  entryHash: string;
};
export const ledgerVerificationSql = `
WITH chain AS (
 SELECT l.*, row_number() OVER (ORDER BY "sequence") AS expected_sequence,
 lag("entryHash", 1, repeat('0', 64)) OVER (ORDER BY "sequence") AS expected_previous
 FROM "AuditLedger" l
)
SELECT "sequence"::text AS sequence, 'chain' AS problem FROM chain
WHERE "sequence" <> expected_sequence OR "previousHash" <> expected_previous
 OR "entryHash" <> encode(sha256(convert_to(jsonb_build_array(
 'audit-ledger-v1', "sequence"::text, "eventId", "operation",
 to_char("recordedAt" AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
 "payloadHash", "previousHash")::text, 'UTF8')), 'hex')
UNION ALL
SELECT l."sequence"::text, 'event contents or deletion' FROM "AuditLedger" l
LEFT JOIN "AuditEvent" e ON e."id" = l."eventId"
LEFT JOIN "AuditLedger" d ON d."eventId" = l."eventId" AND d."operation" = 'DELETE'
WHERE l."operation" = 'INSERT' AND (
 (e."id" IS NULL AND (d."sequence" IS NULL OR d."sequence" <= l."sequence" OR d."payloadHash" <> l."payloadHash"))
 OR (e."id" IS NOT NULL AND (encode(sha256(convert_to(jsonb_build_array(
 e."id", e."submissionId", e."eventType",
 to_char(e."timestamp", 'YYYY-MM-DD"T"HH24:MI:SS.US'), e."metadata")::text, 'UTF8')), 'hex') <> l."payloadHash" OR d."sequence" IS NOT NULL)))
UNION ALL
SELECT d."sequence"::text, 'deletion without matching insert' FROM "AuditLedger" d
LEFT JOIN "AuditLedger" i ON i."eventId" = d."eventId" AND i."operation" = 'INSERT'
WHERE d."operation" = 'DELETE' AND (i."sequence" IS NULL OR i."sequence" >= d."sequence" OR i."payloadHash" <> d."payloadHash")
UNION ALL
SELECT '0', 'unsealed event' FROM "AuditEvent" e
LEFT JOIN "AuditLedger" l ON l."eventId" = e."id" AND l."operation" = 'INSERT'
WHERE l."sequence" IS NULL`;

export function parseAuditCheckpoint(value: unknown): AuditCheckpoint {
  if (!value || typeof value !== "object")
    throw new Error("Invalid checkpoint");
  const c = value as Partial<AuditCheckpoint>;
  if (
    c.version !== 1 ||
    typeof c.sequence !== "string" ||
    !/^[1-9]\d*$/.test(c.sequence) ||
    typeof c.entryHash !== "string" ||
    !/^[a-f0-9]{64}$/.test(c.entryHash)
  )
    throw new Error("Invalid checkpoint");
  return c as AuditCheckpoint;
}
export function assertAuditCheckpoint(
  checkpoint: AuditCheckpoint,
  storedHash: string | undefined,
) {
  if (storedHash !== checkpoint.entryHash)
    throw new Error(
      "Checkpoint mismatch: ledger was truncated, replaced, or altered",
    );
}
