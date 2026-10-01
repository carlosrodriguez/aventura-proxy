import "server-only";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { gzipSync } from "node:zlib";
import { randomUUID, createHash } from "node:crypto";
import { db } from "@/lib/db";
import {
  readPrivate,
  putPrivate,
  deletePrivate,
  temporaryUrl,
} from "@/lib/storage";
import { HttpError } from "@/lib/security/http";
const run = promisify(execFile);
const hash = (bytes: Uint8Array) =>
  createHash("sha256").update(bytes).digest("hex");
export function testDataToolsEnabled() {
  return (
    process.env.ENABLE_TEST_DATA_TOOLS === "true" &&
    process.env.PROXY_TEST_MODE === "true" &&
    process.env.APP_URL === "https://dev.aventuraislesproxy.com"
  );
}
export async function backupTestData(admin: string, clear: boolean) {
  if (!testDataToolsEnabled()) throw new HttpError(404, "Unavailable");
  const backupKey = `backups/dev-tests/${new Date().toISOString().replace(/[:.]/g, "-")}-${randomUUID()}.json.gz`;
  const result = await db().$transaction(
    async (tx) => {
      // Readers remain available. Block signing-record writes until the consistent backup is saved.
      await tx.$executeRawUnsafe(
        'LOCK TABLE "ProxySubmission", "AuditEvent", "EmailVerification" IN SHARE MODE',
      );
      const rows = await tx.proxySubmission.findMany({
        take: 1001,
        include: { verification: true, events: true },
        orderBy: { id: "asc" },
      });
      if (rows.length > 1000)
        throw new HttpError(
          409,
          "Use the operator backup procedure for more than 1000 test records",
        );
      const snapshot = await tx.$queryRaw<
        Array<{ snapshot: string }>
      >`SELECT pg_export_snapshot() AS snapshot`;
      const database = new URL(process.env.DATABASE_URL!);
      const dump = await run(
        "/usr/bin/pg_dump",
        ["--format=custom", "--snapshot", snapshot[0].snapshot],
        {
          encoding: "buffer",
          maxBuffer: 64 * 1024 * 1024,
          timeout: 90000,
          env: {
            ...process.env,
            PGHOST: database.hostname,
            PGPORT: database.port || "5432",
            PGDATABASE: database.pathname.slice(1),
            PGUSER: decodeURIComponent(database.username),
            PGPASSWORD: decodeURIComponent(database.password),
          },
        },
      );
      const keys = [
        ...new Set(
          rows
            .flatMap((r) => [r.signatureRef, r.finalPdfRef, r.auditRef])
            .filter((key): key is string => Boolean(key)),
        ),
      ];
      const files: Array<{ key: string; sha256: string; content: string }> = [];
      let size = dump.stdout.length;
      for (const key of keys) {
        const bytes = await readPrivate(key);
        size += bytes.length;
        if (size > 64 * 1024 * 1024)
          throw new HttpError(
            409,
            "Use the operator procedure for backups above 64 MB",
          );
        files.push({
          key,
          sha256: hash(bytes),
          content: Buffer.from(bytes).toString("base64"),
        });
      }
      const bundle = gzipSync(
        Buffer.from(
          JSON.stringify({
            version: 1,
            environment: "dev",
            createdAt: new Date().toISOString(),
            operator: admin,
            recordCount: rows.length,
            database: {
              format: "pg_dump-custom",
              sha256: hash(dump.stdout),
              content: dump.stdout.toString("base64"),
            },
            files,
          }),
        ),
      );
      await putPrivate(backupKey, bundle, "application/gzip");
      if (hash(await readPrivate(backupKey)) !== hash(bundle))
        throw new Error("Backup verification failed");
      if (clear && rows.length) {
        // Row/event deletions are recorded by the existing audit-ledger triggers. Keep the ledger and admin access.
        await tx.$executeRawUnsafe(
          'LOCK TABLE "ProxySubmission", "AuditEvent", "EmailVerification" IN ACCESS EXCLUSIVE MODE',
        );
        await tx.proxySubmission.deleteMany({
          where: { id: { in: rows.map((r) => r.id) } },
        });
      }
      return { count: rows.length, keys, sha256: hash(bundle) };
    },
    { timeout: 180000, maxWait: 10000, isolationLevel: "RepeatableRead" },
  );
  let filesRemaining = 0;
  if (clear)
    for (const key of result.keys) {
      try {
        await deletePrivate(key);
      } catch {
        filesRemaining++;
      }
    }
  return {
    backupKey,
    sha256: result.sha256,
    count: result.count,
    cleared: clear,
    filesRemaining,
    url: await temporaryUrl(backupKey, "dev-test-backup.json.gz"),
  };
}
