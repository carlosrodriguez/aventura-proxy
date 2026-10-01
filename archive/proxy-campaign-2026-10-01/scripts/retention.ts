import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { retentionDays } from "../lib/config";
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL required");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});
async function run() {
  if (process.env.ENABLE_RETENTION_DELETION !== "true") {
    console.log(
      "Record deletion is disabled pending campaign-close retention review.",
    );
    return;
  }
  const cutoff = new Date(Date.now() - retentionDays() * 86400000);
  const rows = await prisma.proxySubmission.findMany({
    where: { createdAt: { lt: cutoff } },
    take: 100,
    select: { id: true, signatureRef: true, finalPdfRef: true, auditRef: true },
  });
  if (
    rows.length &&
    (!process.env.SPACES_ENDPOINT ||
      !process.env.SPACES_BUCKET ||
      !process.env.SPACES_ACCESS_KEY ||
      !process.env.SPACES_SECRET_KEY)
  )
    throw new Error("Storage configuration required before deletion");
  const storage = new S3Client({
    endpoint: process.env.SPACES_ENDPOINT,
    region: process.env.SPACES_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.SPACES_ACCESS_KEY ?? "",
      secretAccessKey: process.env.SPACES_SECRET_KEY ?? "",
    },
  });
  for (const s of rows) {
    for (const key of [s.signatureRef, s.finalPdfRef, s.auditRef].filter(
      (v): v is string => Boolean(v),
    ))
      await storage.send(
        new DeleteObjectCommand({
          Bucket: process.env.SPACES_BUCKET,
          Key: key,
        }),
      );
    await prisma.proxySubmission.delete({ where: { id: s.id } });
  }
  const now = new Date();
  await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: now } } });
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: now } } });
  await prisma.adminChallenge.deleteMany({ where: { expiresAt: { lt: now } } });
  console.log(
    `Retention completed: ${rows.length} expired records removed. Repeat until zero.`,
  );
}
try {
  await run();
} finally {
  await prisma.$disconnect();
}
