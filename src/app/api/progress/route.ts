import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function GET(request: NextRequest) {
  try {
    const guestId = request.nextUrl.searchParams.get('guestId');

    if (!guestId) {
      return NextResponse.json({ error: 'Missing guestId' }, { status: 400 });
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

    const allAttempted = await prisma.userProblemState.findMany({
      where: { guestId },
      select: { problemId: true },
    });
    const attemptedIds = new Set(allAttempted.map((s) => s.problemId));

    const recommendedProblem = await prisma.problem.findFirst({
      where: {
        difficulty: 'EASY',
        id: { notIn: Array.from(attemptedIds) },
      },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, title: true, slug: true, pattern: true, difficulty: true },
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
    });
  } catch (error) {
    console.error('Failed to fetch progress:', error);
    return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
  }
}
