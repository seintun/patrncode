-- Wave 3 tutor system additions

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'RequestStatus') THEN
    CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'FULFILLED', 'FAILED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "PatternWeakness" (
  "id" TEXT NOT NULL,
  "guestId" TEXT NOT NULL,
  "pattern" "Pattern" NOT NULL,
  "failedCount" INTEGER NOT NULL DEFAULT 0,
  "successCount" INTEGER NOT NULL DEFAULT 0,
  "lastPracticedAt" TIMESTAMP(3),
  "confidenceScore" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "PatternWeakness_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CustomProblemRequest" (
  "id" TEXT NOT NULL,
  "guestId" TEXT NOT NULL,
  "pattern" "Pattern" NOT NULL,
  "difficulty" "Difficulty",
  "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
  "title" TEXT,
  "statement" TEXT,
  "starterCode" TEXT,
  "testCases" JSONB,
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CustomProblemRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PatternWeakness_guestId_pattern_key"
  ON "PatternWeakness"("guestId", "pattern");

CREATE INDEX IF NOT EXISTS "PatternWeakness_guestId_idx"
  ON "PatternWeakness"("guestId");

CREATE INDEX IF NOT EXISTS "PatternWeakness_confidenceScore_idx"
  ON "PatternWeakness"("confidenceScore");

CREATE INDEX IF NOT EXISTS "CustomProblemRequest_guestId_createdAt_idx"
  ON "CustomProblemRequest"("guestId", "createdAt");

CREATE INDEX IF NOT EXISTS "CustomProblemRequest_status_idx"
  ON "CustomProblemRequest"("status");

CREATE EXTENSION IF NOT EXISTS pg_trgm;
