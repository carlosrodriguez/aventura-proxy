CREATE TABLE "EmailSigningSession" (
 "id" UUID NOT NULL,
 "tokenHash" TEXT NOT NULL,
 "email" TEXT NOT NULL,
 "campaignId" TEXT NOT NULL,
 "codeHash" TEXT NOT NULL,
 "codeExpiresAt" TIMESTAMP(3) NOT NULL,
 "accessExpiresAt" TIMESTAMP(3) NOT NULL,
 "sentAt" TIMESTAMP(3) NOT NULL,
 "attempts" INTEGER NOT NULL DEFAULT 0,
 "resendCount" INTEGER NOT NULL DEFAULT 0,
 "verifiedAt" TIMESTAMP(3),
 "consumedAt" TIMESTAMP(3),
 "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "EmailSigningSession_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "EmailSigningSession_tokenHash_key" ON "EmailSigningSession"("tokenHash");
CREATE INDEX "EmailSigningSession_accessExpiresAt_idx" ON "EmailSigningSession"("accessExpiresAt");
