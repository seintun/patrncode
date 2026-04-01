import { prisma } from '@/lib/db/prisma';

export async function cleanupExpiredSessions(
  guestId: string,
): Promise<{ expiredCount: number; abandonedCount: number; resetMasteryCount: number }> {
  const expiredSessions = await prisma.session.findMany({
    where: {
      guestId,
      status: 'IN_PROGRESS',
      expiresAt: { lt: new Date() },
    },
    select: {
      id: true,
      problemId: true,
    },
  });

  if (expiredSessions.length === 0) {
    return { expiredCount: 0, abandonedCount: 0, resetMasteryCount: 0 };
  }

  const sessionIds = expiredSessions.map((session) => session.id);
  const problemIds = Array.from(new Set(expiredSessions.map((session) => session.problemId)));

  const completedProblems = await prisma.session.findMany({
    where: {
      guestId,
      problemId: { in: problemIds },
      status: 'COMPLETED',
    },
    select: { problemId: true },
    distinct: ['problemId'],
  });

  const completedProblemIdSet = new Set(completedProblems.map((session) => session.problemId));
  const resetProblemIds = problemIds.filter((problemId) => !completedProblemIdSet.has(problemId));

  const [abandonedResult, resetMasteryResult] = await Promise.all([
    prisma.session.updateMany({
      where: { id: { in: sessionIds } },
      data: { status: 'ABANDONED' },
    }),
    resetProblemIds.length > 0
      ? prisma.userProblemState.updateMany({
          where: {
            guestId,
            problemId: { in: resetProblemIds },
            mastery: 'IN_PROGRESS',
          },
          data: { mastery: 'UNSEEN' },
        })
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    expiredCount: expiredSessions.length,
    abandonedCount: abandonedResult.count,
    resetMasteryCount: resetMasteryResult.count,
  };
}
