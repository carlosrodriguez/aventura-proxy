import "dotenv/config";
import { readFile, writeFile } from "node:fs/promises";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  ledgerVerificationSql,
  parseAuditCheckpoint,
  assertAuditCheckpoint,
} from "../lib/security/audit-ledger";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
const args = process.argv.slice(2);
function option(name: string) {
  const index = args.indexOf(name);
  if (index < 0) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--"))
    throw new Error(`${name} needs a file path`);
  return value;
}
try {
  const previousPath = option("--checkpoint");
  const outputPath = option("--write-checkpoint");
  const previous = previousPath
    ? parseAuditCheckpoint(JSON.parse(await readFile(previousPath, "utf8")))
    : undefined;
  const checkpoint = await prisma.$transaction(
    async (tx) => {
      const failures = await tx.$queryRawUnsafe<
        Array<{ sequence: string; problem: string }>
      >(ledgerVerificationSql);
      if (failures.length)
        throw new Error(
          `Audit verification failed: ${JSON.stringify(failures.slice(0, 10))}`,
        );
      if (previous) {
        const saved = await tx.$queryRaw<
          Array<{ entryHash: string }>
        >`SELECT "entryHash" FROM "AuditLedger" WHERE "sequence" = ${BigInt(previous.sequence)}`;
        assertAuditCheckpoint(previous, saved[0]?.entryHash);
      }
      const head = await tx.$queryRaw<
        Array<{ sequence: string; entryHash: string }>
      >`SELECT "sequence"::text AS sequence, "entryHash" FROM "AuditLedger" ORDER BY "sequence" DESC LIMIT 1`;
      return head[0] ? { version: 1 as const, ...head[0] } : null;
    },
    { isolationLevel: "RepeatableRead", timeout: 60000 },
  );
  if (outputPath) {
    if (!checkpoint) throw new Error("No audit events to checkpoint yet");
    await writeFile(outputPath, JSON.stringify(checkpoint, null, 2) + "\n", {
      flag: "wx",
      mode: 0o600,
    });
  }
  console.log(JSON.stringify({ verified: true, checkpoint }));
} finally {
  await prisma.$disconnect();
}
