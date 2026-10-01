import { randomUUID, createHash } from "node:crypto";
import { db } from "../lib/db";
import { generateProxy } from "../lib/pdf/proxy";
import { proxyConfig } from "../lib/config";
import { putPrivate, readPrivate, deletePrivate } from "../lib/storage";
import { transactionalEmail } from "../lib/email";

// Operator-only service checks. Never opens collection or creates a submission.
if (
  process.env.APP_URL !== "https://aventuraislesproxy.com" ||
  process.env.SITE_STATE !== "closed" ||
  process.env.ENABLE_SUBMISSIONS !== "false"
)
  throw new Error("Production must remain closed for readiness checks");
const sendTest = process.argv.includes("--send-test-email");
const checks: Record<string, string | number> = {};
try {
  await db().$queryRaw`SELECT 1`;
  checks.database = "connected";
  checks.submissions = await db().proxySubmission.count();
  const migrations = await db().$queryRaw<
    Array<{ count: bigint }>
  >`SELECT count(*) AS count FROM "_prisma_migrations" WHERE finished_at IS NULL AND rolled_back_at IS NULL`;
  if (Number(migrations[0].count))
    throw new Error("Unfinished database migration");
  checks.migrations = "complete";
  // This process generates an explicitly unsigned, marked test document only.
  process.env.PROXY_TEST_MODE = "true";
  const id = `prelaunch-${randomUUID()}`;
  const pdf = await generateProxy(
    {
      id,
      houseNumber: "000",
      street: "TEST ADDRESS",
      firstName: "Production",
      lastName: "Service Test",
      entityName: null,
      signerTitle: null,
      signedAt: new Date(),
      templateVersion: proxyConfig.templateVersion,
    },
    null,
  );
  checks.officialPdf = "generated unsigned test using pinned template";
  const key = `prelaunch-checks/${id}.pdf`;
  const sha = (bytes: Uint8Array) =>
    createHash("sha256").update(bytes).digest("hex");
  await putPrivate(key, pdf, "application/pdf");
  try {
    if (sha(await readPrivate(key)) !== sha(pdf))
      throw new Error("Private PDF roundtrip mismatch");
    const anonymous = await fetch(
      `${process.env.SPACES_ENDPOINT}/${process.env.SPACES_BUCKET}/${key}`,
      { redirect: "manual" },
    );
    if (anonymous.status !== 403)
      throw new Error(
        `Private PDF anonymous access returned ${anonymous.status}`,
      );
    checks.storage = "write/read fingerprint verified; anonymous access denied";
  } finally {
    await deletePrivate(key);
  }
  if (sendTest) {
    await transactionalEmail(
      "rocada@me.com",
      "Production prelaunch email and PDF test",
      "This is a production service test. Collection remains closed. The attached proxy is unsigned and marked TEST ONLY. It is not for filing with the Association.",
      id,
      pdf,
    );
    checks.email =
      "test accepted by provider for rocada@me.com; inbox confirmation needed";
  }
  checks.turnstile =
    process.env.TURNSTILE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
      ? "configured; browser challenge requires separate verification"
      : "pending";
  console.log(JSON.stringify(checks));
} finally {
  await db().$disconnect();
}
