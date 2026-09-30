-- Separate from personal-data records: retention preserves only IDs and digests.
CREATE TABLE "AuditLedger" (
  "sequence" BIGINT PRIMARY KEY,
  "eventId" UUID NOT NULL,
  "operation" TEXT NOT NULL CHECK ("operation" IN ('INSERT', 'DELETE')),
  "recordedAt" TIMESTAMPTZ NOT NULL DEFAULT clock_timestamp(),
  "payloadHash" TEXT NOT NULL,
  "previousHash" TEXT NOT NULL,
  "entryHash" TEXT NOT NULL,
  UNIQUE ("eventId", "operation")
);
CREATE FUNCTION audit_payload_hash(e "AuditEvent") RETURNS TEXT
LANGUAGE SQL STABLE AS $$
 SELECT encode(sha256(convert_to(jsonb_build_array(
   e."id", e."submissionId", e."eventType",
   to_char(e."timestamp", 'YYYY-MM-DD"T"HH24:MI:SS.US'), e."metadata"
 )::text, 'UTF8')), 'hex')
$$;
CREATE FUNCTION audit_entry_hash(seq BIGINT, event_id UUID, operation TEXT,
 recorded_at TIMESTAMPTZ, payload_hash TEXT, previous_hash TEXT) RETURNS TEXT
LANGUAGE SQL STABLE AS $$
 SELECT encode(sha256(convert_to(jsonb_build_array(
   'audit-ledger-v1', seq::text, event_id, operation,
   to_char(recorded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US'),
   payload_hash, previous_hash
 )::text, 'UTF8')), 'hex')
$$;
CREATE FUNCTION append_audit_ledger(event_id UUID, operation TEXT, payload_hash TEXT)
RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE seq BIGINT; previous_hash TEXT; recorded_at TIMESTAMPTZ;
BEGIN
 -- Serialize writers through commit, so concurrent events cannot fork the chain.
 PERFORM pg_advisory_xact_lock(728193041);
 SELECT l."sequence" + 1, l."entryHash" INTO seq, previous_hash
 FROM "AuditLedger" l ORDER BY l."sequence" DESC LIMIT 1;
 seq := COALESCE(seq, 1);
 previous_hash := COALESCE(previous_hash, repeat('0', 64));
 recorded_at := clock_timestamp();
 INSERT INTO "AuditLedger" VALUES (seq, event_id, operation, recorded_at,
   payload_hash, previous_hash,
   audit_entry_hash(seq, event_id, operation, recorded_at, payload_hash, previous_hash));
END $$;
-- Historical records are sealed as they exist at migration time, not retroactively authenticated.
DO $$ DECLARE e "AuditEvent"; BEGIN
 FOR e IN SELECT * FROM "AuditEvent" ORDER BY "timestamp", "id" LOOP
   PERFORM append_audit_ledger(e."id", 'INSERT', audit_payload_hash(e));
 END LOOP;
END $$;
CREATE FUNCTION capture_audit_change() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
 IF TG_OP = 'UPDATE' THEN
   RAISE EXCEPTION 'Audit events are append-only; record a new event instead';
 ELSIF TG_OP = 'DELETE' THEN
   PERFORM append_audit_ledger(OLD."id", 'DELETE', audit_payload_hash(OLD));
   RETURN OLD;
 ELSE
   PERFORM append_audit_ledger(NEW."id", 'INSERT', audit_payload_hash(NEW));
   RETURN NEW;
 END IF;
END $$;
CREATE TRIGGER audit_capture AFTER INSERT OR DELETE ON "AuditEvent"
 FOR EACH ROW EXECUTE FUNCTION capture_audit_change();
CREATE TRIGGER audit_no_update BEFORE UPDATE ON "AuditEvent"
 FOR EACH ROW EXECUTE FUNCTION capture_audit_change();
CREATE FUNCTION reject_ledger_mutation() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'Audit ledger is append-only'; END $$;
CREATE TRIGGER ledger_no_mutation BEFORE UPDATE OR DELETE OR TRUNCATE ON "AuditLedger"
 FOR EACH STATEMENT EXECUTE FUNCTION reject_ledger_mutation();
CREATE TRIGGER audit_no_truncate BEFORE TRUNCATE ON "AuditEvent"
 FOR EACH STATEMENT EXECUTE FUNCTION reject_ledger_mutation();
