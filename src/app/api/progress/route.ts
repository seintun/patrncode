import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { withErrorHandling } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';

async function handler(_request: NextRequest): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const guestId = getGuestIdFromCookie(cookieStore);

    if (!guestId) {
      return NextResponse.json({ error: 'Unauthorized: Guest ID missing' }, { status: 401 });
    }

    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [
      totalSolved,
      patternsPracticed,
      sessionsThisWeek,
      recentSessions,
      needsRefresh,
      inProgressProblems,
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
        where: { guestId, mastery: 'IN_PROGRESS' },
        take: 3,
        select: {
          problem: {
            select: { id: true, title: true, slug: true, pattern: true, difficulty: true },
          },
          attemptCount: true,
        },
        orderBy: { lastAttemptedAt: 'desc' },
      }),
    ]);

    const [allAttempted, problemHistory] = await Promise.all([
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
    ]);
    const attemptedIds = new Set(allAttempted.map((s) => s.problemId));

    const recommendedProblem = await prisma.problem.findFirst({
      where: {
        difficulty: 'EASY',
        id: { notIn: Array.from(attemptedIds) },
      },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, slug: true, pattern: true, difficulty: true },
    });

    const allProblems = await prisma.problem.findMany({
      select: { pattern: true },
    });
    const problemsByPattern = new Map<string, number>();
    for (const p of allProblems) {
      problemsByPattern.set(p.pattern, (problemsByPattern.get(p.pattern) ?? 0) + 1);
    }

    const patternStats = Array.from(problemsByPattern.entries()).map(([pattern, total]) => {
      const states = problemHistory.filter((h) => h.problem.pattern === pattern);
      return {
        pattern,
        total,
        mastered: states.filter((s) => s.mastery === 'MASTERED').length,
        inProgress: states.filter((s) => s.mastery === 'IN_PROGRESS').length,
        needsRefresh: states.filter((s) => s.mastery === 'NEEDS_REFRESH').length,
        unseen: total - states.length,
      };
    });

    return NextResponse.json({
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
      problemHistory,
    });
  } catch (error) {
    console.error('Failed to fetch progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}

export const GET = withErrorHandling(handler);
