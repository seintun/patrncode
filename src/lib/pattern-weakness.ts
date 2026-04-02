import { prisma } from '@/lib/db/prisma';
import { Prisma } from '@/generated/prisma/client';
import type { Pattern } from '@/generated/prisma/enums';
import { isPrismaMissingTableError } from '@/lib/db/prisma-errors';

export type PatternOutcome = 'SOLVED_ZERO_HINTS' | 'SOLVED_WITH_HINTS' | 'ATTEMPTED';

export interface WeakPatternSummary {
  pattern: Pattern;
  confidenceScore: number;
  failedCount: number;
  successCount: number;
}

export async function updatePatternWeakness(params: {
  guestId: string;
  pattern: Pattern;
  outcome: PatternOutcome;
}): Promise<void> {
  const { guestId, pattern, outcome } = params;

  try {
    const isSuccess = outcome === 'SOLVED_ZERO_HINTS';
    const failedIncrement = outcome === 'ATTEMPTED' ? 1 : 0;
    const successIncrement = isSuccess ? 1 : 0;
    const now = new Date();

    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO "PatternWeakness" (
        "id",
        "guestId",
        "pattern",
        "failedCount",
        "successCount",
        "confidenceScore",
        "createdAt",
        "updatedAt",
        "lastPracticedAt"
      )
      VALUES (
        ${`${guestId}:${pattern}`},
        ${guestId},
        ${pattern}::"Pattern",
        ${failedIncrement},
        ${successIncrement},
        CASE
          WHEN (${failedIncrement} + ${successIncrement}) > 0
            THEN ${successIncrement}::double precision / (${failedIncrement} + ${successIncrement})
          ELSE 0.5
        END,
        ${now},
        ${now},
        ${now}
      )
      ON CONFLICT ("guestId", "pattern")
      DO UPDATE SET
        "failedCount" = "PatternWeakness"."failedCount" + EXCLUDED."failedCount",
        "successCount" = "PatternWeakness"."successCount" + EXCLUDED."successCount",
        "lastPracticedAt" = EXCLUDED."lastPracticedAt",
        "updatedAt" = EXCLUDED."updatedAt",
        "confidenceScore" = CASE
          WHEN (
            "PatternWeakness"."failedCount"
            + "PatternWeakness"."successCount"
            + EXCLUDED."failedCount"
            + EXCLUDED."successCount"
          ) > 0
            THEN (
              "PatternWeakness"."successCount" + EXCLUDED."successCount"
            )::double precision / (
              "PatternWeakness"."failedCount"
              + "PatternWeakness"."successCount"
              + EXCLUDED."failedCount"
              + EXCLUDED."successCount"
            )
          ELSE 0.5
        END
    `);
  } catch (error) {
    if (isPrismaMissingTableError(error, 'PatternWeakness')) {
      return;
    }
    throw error;
  }
}

export async function getWeakPatterns(guestId: string, limit = 5): Promise<WeakPatternSummary[]> {
  try {
    const rows = await prisma.patternWeakness.findMany({
      where: { guestId },
      orderBy: { confidenceScore: 'asc' },
      take: limit,
      select: {
        pattern: true,
        confidenceScore: true,
        failedCount: true,
        successCount: true,
      },
    });

    if (rows.length > 0) {
      return rows;
    }
  } catch (error) {
    if (!isPrismaMissingTableError(error, 'PatternWeakness')) {
      throw error;
    }
  }

  const states = await prisma.userProblemState.findMany({
    where: { guestId, attemptCount: { gt: 0 } },
    select: {
      attemptCount: true,
      solveCount: true,
      problem: { select: { pattern: true } },
    },
  });

  const aggregate = new Map<
    Pattern,
    {
      attempts: number;
      solves: number;
    }
  >();

  for (const state of states) {
    const pattern = state.problem.pattern;
    const current = aggregate.get(pattern) ?? { attempts: 0, solves: 0 };
    current.attempts += state.attemptCount;
    current.solves += state.solveCount;
    aggregate.set(pattern, current);
  }

  return Array.from(aggregate.entries())
    .map(([pattern, value]) => {
      const failedCount = Math.max(value.attempts - value.solves, 0);
      const successCount = Math.max(value.solves, 0);
      const total = failedCount + successCount;

      return {
        pattern,
        failedCount,
        successCount,
        confidenceScore: total > 0 ? successCount / total : 0.5,
      };
    })
    .sort((a, b) => a.confidenceScore - b.confidenceScore)
    .slice(0, limit);
}
