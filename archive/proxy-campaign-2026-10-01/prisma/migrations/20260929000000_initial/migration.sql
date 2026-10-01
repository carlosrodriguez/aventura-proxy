-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('SIGNED', 'VERIFIED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "AssociationStatus" AS ENUM ('pending', 'accepted', 'rejected', 'duplicate', 'revoked');

-- CreateTable
CREATE TABLE "ProxySubmission" (
    "id" UUID NOT NULL,
    "houseNumber" TEXT NOT NULL,
    "street" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ownershipType" TEXT NOT NULL,
    "entityName" TEXT,
    "signerTitle" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'SIGNED',
    "associationStatus" "AssociationStatus" NOT NULL DEFAULT 'pending',
    "likelyDuplicate" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "signedAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),
    "finalizedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "receiptSentAt" TIMESTAMP(3),
    "associationSentAt" TIMESTAMP(3),
    "revocationRequestedAt" TIMESTAMP(3),
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "timezone" TEXT,
    "signatureRef" TEXT NOT NULL,
    "finalPdfRef" TEXT,
    "auditRef" TEXT,
    "pdfSha256" TEXT,
    "templateVersion" TEXT NOT NULL,
    "accessExpiresAt" TIMESTAMP(3) NOT NULL,
    "accessTokenHash" TEXT NOT NULL,

    CONSTRAINT "ProxySubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailVerification" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "codeHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "sentAt" TIMESTAMP(3) NOT NULL,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "EmailVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" UUID NOT NULL,
    "submissionId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL,

    CONSTRAINT "AuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "resetAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AdminChallenge" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "AdminChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "tokenHash" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("tokenHash")
);

-- CreateIndex
CREATE INDEX "ProxySubmission_houseNumber_street_idx" ON "ProxySubmission"("houseNumber", "street");

-- CreateIndex
CREATE INDEX "ProxySubmission_createdAt_idx" ON "ProxySubmission"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "EmailVerification_submissionId_key" ON "EmailVerification"("submissionId");

-- CreateIndex
CREATE INDEX "AuditEvent_submissionId_timestamp_idx" ON "AuditEvent"("submissionId", "timestamp");

-- CreateIndex
CREATE INDEX "RateLimit_resetAt_idx" ON "RateLimit"("resetAt");

-- CreateIndex
CREATE UNIQUE INDEX "AdminChallenge_tokenHash_key" ON "AdminChallenge"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");

-- AddForeignKey
ALTER TABLE "EmailVerification" ADD CONSTRAINT "EmailVerification_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProxySubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditEvent" ADD CONSTRAINT "AuditEvent_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "ProxySubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

