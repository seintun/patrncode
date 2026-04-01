import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getCachedRecommendation, setCachedRecommendation } from '@/lib/recommendation-cache';
import { withAuth } from '@/lib/errors/api';
import type { Pattern } from '@/generated/prisma/enums';

async function handler(req: NextRequest, { guestId }: { guestId: string }): Promise<Response> {
  const requestedGuestId = req.nextUrl.searchParams.get('guestId');
  const effectiveGuestId = requestedGuestId ?? guestId;

  const cached = await getCachedRecommendation(effectiveGuestId);
  if (cached) {
    return NextResponse.json(cached);
  }

  const weakPatterns: Array<{ pattern: Pattern; confidenceScore: number }> =
    await prisma.patternWeakness.findMany({
      where: { guestId: effectiveGuestId },
      orderBy: { confidenceScore: 'asc' },
      take: 3,
      select: { pattern: true, confidenceScore: true },
    });

  const userStates = await prisma.userProblemState.findMany({
    where: { guestId: effectiveGuestId, mastery: { not: 'MASTERED' } },
    select: { problemId: true },
  });

  const attemptedIds = userStates.map((state) => state.problemId);

  let recommendedProblem: {
    id: string;
    slug: string;
    title: string;
    pattern: Pattern;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  } | null = null;
  let reason = '';

  if (weakPatterns.length > 0) {
    const weakPatternNames = weakPatterns.map((p) => p.pattern);
    recommendedProblem = await prisma.problem.findFirst({
      where: {
        isCurated: true,
        id: { notIn: attemptedIds },
        pattern: { in: weakPatternNames },
      },
      orderBy: { curatedOrder: 'asc' },
      select: { id: true, slug: true, title: true, pattern: true, difficulty: true },
    });

    if (recommendedProblem) {
      const weakest = weakPatterns[0];
      reason = `You struggle with ${weakest.pattern.replace(/_/g, ' ')} (${Math.round(weakest.confidenceScore * 100)}% confidence). This problem targets that pattern.`;
    }
  }

  if (!recommendedProblem) {
    const lastAttempted = await prisma.userProblemState.findFirst({
      where: { guestId: effectiveGuestId },
      orderBy: { lastAttemptedAt: 'desc' },
      select: {
        problem: {
          select: { curatedOrder: true },
        },
      },
    });

    recommendedProblem = await prisma.problem.findFirst({
      where: {
        isCurated: true,
        curatedOrder: lastAttempted ? { gt: lastAttempted.problem.curatedOrder ?? 0 } : undefined,
        id: { notIn: attemptedIds },
      },
      orderBy: { curatedOrder: 'asc' },
      select: { id: true, slug: true, title: true, pattern: true, difficulty: true },
    });

    reason = 'Next problem in the SophoCode 75 roadmap.';
  }

  const result = {
    problemId: recommendedProblem?.id ?? null,
    slug: recommendedProblem?.slug ?? null,
    title: recommendedProblem?.title ?? null,
    pattern: recommendedProblem?.pattern ?? null,
    difficulty: recommendedProblem?.difficulty ?? null,
    reason: recommendedProblem ? reason : 'All problems completed!',
  };

  await setCachedRecommendation(effectiveGuestId, result);

  return NextResponse.json(result);
}

export const GET = withAuth(handler);
