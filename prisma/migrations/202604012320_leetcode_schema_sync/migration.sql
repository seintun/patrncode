-- Ensure LeetCode schema objects exist for migrate deploy.

-- Add missing Pattern enum values when rolling forward older databases.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Pattern' AND e.enumlabel = 'TRIES'
  ) THEN
    ALTER TYPE "Pattern" ADD VALUE 'TRIES';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Pattern' AND e.enumlabel = 'BIT_MANIPULATION'
  ) THEN
    ALTER TYPE "Pattern" ADD VALUE 'BIT_MANIPULATION';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Pattern' AND e.enumlabel = 'INTERVALS'
  ) THEN
    ALTER TYPE "Pattern" ADD VALUE 'INTERVALS';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Pattern' AND e.enumlabel = 'ADVANCED_GRAPHS'
  ) THEN
    ALTER TYPE "Pattern" ADD VALUE 'ADVANCED_GRAPHS';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Pattern' AND e.enumlabel = 'MATH_GEOMETRY'
  ) THEN
    ALTER TYPE "Pattern" ADD VALUE 'MATH_GEOMETRY';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'Pattern' AND e.enumlabel = 'PREFIX_SUM'
  ) THEN
    ALTER TYPE "Pattern" ADD VALUE 'PREFIX_SUM';
  END IF;
END
$$;

ALTER TABLE "Problem"
  ADD COLUMN IF NOT EXISTS "leetcodeNumber" INTEGER;

CREATE TABLE IF NOT EXISTS "ProblemHint" (
  "id" TEXT NOT NULL,
  "problemId" TEXT NOT NULL,
  "level" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'leetcode',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProblemHint_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ProblemHint_problemId_fkey'
  ) THEN
    ALTER TABLE "ProblemHint"
      ADD CONSTRAINT "ProblemHint_problemId_fkey"
      FOREIGN KEY ("problemId") REFERENCES "Problem"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE UNIQUE INDEX IF NOT EXISTS "ProblemHint_problemId_level_key"
  ON "ProblemHint" ("problemId", "level");

CREATE INDEX IF NOT EXISTS "ProblemHint_problemId_idx"
  ON "ProblemHint" ("problemId");
