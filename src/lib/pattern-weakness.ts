import { prisma } from '@/lib/db/prisma';
import type { Pattern } from '@/generated/prisma/enums';

export type PatternOutcome = 'SOLVED_ZERO_HINTS' | 'SOLVED_WITH_HINTS' | 'ATTEMPTED';

export async function updatePatternWeakness(params: {
  guestId: string;
  pattern: Pattern;
  outcome: PatternOutcome;
}): Promise<void> {
  const { guestId, pattern, outcome } = params;

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
}
