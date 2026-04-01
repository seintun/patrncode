import { prisma } from '@/lib/db/prisma';
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

    const weakness = await prisma.patternWeakness.upsert({
      where: {
        guestId_pattern: { guestId, pattern },
      },
      update: {
        failedCount: { increment: failedIncrement },
        successCount: { increment: successIncrement },
        lastPracticedAt: new Date(),
      },
      create: {
        guestId,
        pattern,
        failedCount: failedIncrement,
        successCount: successIncrement,
        confidenceScore: isSuccess ? 1 : 0,
        lastPracticedAt: new Date(),
      },
      select: {
        id: true,
        failedCount: true,
        successCount: true,
      },
    });

    const total = weakness.failedCount + weakness.successCount;
    const confidenceScore = total > 0 ? weakness.successCount / total : 0.5;

    await prisma.patternWeakness.update({
      where: { id: weakness.id },
      data: { confidenceScore },
    });
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
