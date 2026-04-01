import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandling } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';
import { cleanupExpiredSessions } from '@/lib/session/expiry';

async function handler(_request: NextRequest): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const guestId = getGuestIdFromCookie(cookieStore);

    if (!guestId) {
      return NextResponse.json({ error: 'Unauthorized: Guest ID missing' }, { status: 401 });
    }

    cleanupExpiredSessions(guestId).catch((err) => {
      console.error('Failed to clean up expired sessions for guest', guestId, err);
    });

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // Run all independent queries in parallel to minimize P99 latency
    const [
      totalSolved,
      patternsPracticed,
      sessionsThisWeek,
      recentSessions,
      needsRefresh,
      allAttempted,
      problemHistory,
      allProblems,
    ] = await Promise.all([
      prisma.userProblemState.count({
        where: { guestId, solveCount: { gt: 0 } },
      }),
      prisma.userProblemState
        .findMany({
          where: { guestId, attemptCount: { gt: 0 } },
          select: { problem: { select: { pattern: true } } },
          distinct: ['problemId'],
        })
        .then((rows) => new Set(rows.map((r) => r.problem.pattern)).size),
      prisma.session.count({
        where: { guestId, startedAt: { gte: weekAgo } },
      }),
      prisma.session.findMany({
        where: { guestId },
        orderBy: { startedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          outcome: true,
          startedAt: true,
          completedAt: true,
          problem: { select: { title: true, slug: true, pattern: true, difficulty: true } },
        },
      }),
      prisma.userProblemState.findMany({
        where: { guestId, mastery: 'NEEDS_REFRESH' },
        take: 5,
        select: {
          problem: {
            select: { id: true, title: true, slug: true, pattern: true, difficulty: true },
          },
          nextReviewAt: true,
        },
        orderBy: { nextReviewAt: 'asc' },
      }),
      prisma.userProblemState.findMany({
        where: { guestId },
        select: { problemId: true },
      }),
      prisma.userProblemState.findMany({
        where: { guestId, attemptCount: { gt: 0 } },
        take: 50, // Prevent unbounded growth
        orderBy: { lastAttemptedAt: 'desc' },
        select: {
          mastery: true,
          attemptCount: true,
          solveCount: true,
          lastAttemptedAt: true,
          problem: {
            select: { id: true, title: true, slug: true, pattern: true, difficulty: true },
          },
        },
      }),
      prisma.problem.findMany({
        select: { pattern: true },
      }),
    ]);

    // Fetch session history for problem history items
    const historyProblemIds = Array.from(new Set(problemHistory.map((item) => item.problem.id)));
    const historySessions =
      historyProblemIds.length > 0
        ? await prisma.session.findMany({
            where: {
              guestId,
              problemId: { in: historyProblemIds },
            },
            orderBy: { startedAt: 'desc' },
            select: {
              id: true,
              problemId: true,
              status: true,
              expiresAt: true,
            },
          })
        : [];

    const latestSessionMeta = new Map<
      string,
      {
        latestSessionId: string | null;
        latestCompletedSessionId: string | null;
        sessionStatus: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | null;
      }
    >();

    for (const session of historySessions) {
      if (!latestSessionMeta.has(session.problemId)) {
        let sessionStatus: 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | null = null;
        if (session.status === 'COMPLETED') {
          sessionStatus = 'COMPLETED';
        } else if (session.status === 'ABANDONED') {
          sessionStatus = 'ABANDONED';
        } else if (
          session.status === 'IN_PROGRESS' &&
          (session.expiresAt == null || session.expiresAt.getTime() > now.getTime())
        ) {
          sessionStatus = 'ACTIVE';
        } else if (session.status === 'IN_PROGRESS') {
          sessionStatus = 'ABANDONED';
        }

        latestSessionMeta.set(session.problemId, {
          latestSessionId: session.id,
          latestCompletedSessionId: session.status === 'COMPLETED' ? session.id : null,
          sessionStatus,
        });
      }

      const meta = latestSessionMeta.get(session.problemId);
      if (meta && meta.latestCompletedSessionId == null && session.status === 'COMPLETED') {
        meta.latestCompletedSessionId = session.id;
      }
    }

    const problemHistoryWithSessionMeta = problemHistory.map((item) => {
      const meta = latestSessionMeta.get(item.problem.id);
      return {
        ...item,
        latestSessionId: meta?.latestSessionId ?? null,
        latestCompletedSessionId: meta?.latestCompletedSessionId ?? null,
        sessionStatus: meta?.sessionStatus ?? null,
      };
    });

    const inProgressProblems = problemHistoryWithSessionMeta
      .filter((item) => item.sessionStatus === 'ACTIVE')
      .slice(0, 3)
      .map((item) => ({
        problem: item.problem,
        attemptCount: item.attemptCount,
      }));

    const attemptedIds = new Set(allAttempted.map((s) => s.problemId));

    const recommendedProblem = await prisma.problem.findFirst({
      where: {
        difficulty: 'EASY',
        id: { notIn: Array.from(attemptedIds) },
      },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, slug: true, pattern: true, difficulty: true },
    });

    const problemsByPattern = new Map<string, number>();
    for (const p of allProblems) {
      problemsByPattern.set(p.pattern, (problemsByPattern.get(p.pattern) ?? 0) + 1);
    }

    const patternStats = Array.from(problemsByPattern.entries()).map(([pattern, total]) => {
      const states = problemHistoryWithSessionMeta.filter((h) => h.problem.pattern === pattern);
      const mastered = states.filter((s) => s.mastery === 'MASTERED').length;
      const inProgress = states.filter((s) => s.sessionStatus === 'ACTIVE').length;
      const needsRefreshCount = states.filter((s) => s.mastery === 'NEEDS_REFRESH').length;
      return {
        pattern,
        total,
        mastered,
        inProgress,
        needsRefresh: needsRefreshCount,
        unseen: Math.max(total - mastered - inProgress - needsRefreshCount, 0),
      };
    });

    return NextResponse.json(
      {
        stats: {
          totalSolved,
          patternsPracticed,
          sessionsThisWeek,
        },
        recentSessions,
        needsRefresh,
        inProgressProblems,
        recommendedProblem,
        patternStats,
        problemHistory: problemHistoryWithSessionMeta,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store, max-age=0',
        },
      },
    );
  } catch (error) {
    console.error('Failed to fetch progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export const GET = withErrorHandling(handler);
