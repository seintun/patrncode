import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Pattern, Difficulty } from '@/generated/prisma/enums';
import { handleApiError } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pattern = searchParams.get('pattern') as Pattern | null;
    const difficulty = searchParams.get('difficulty') as Difficulty | null;
    const search = searchParams.get('search') || '';
    const curated = searchParams.get('curated') === 'true';

    const cookieStore = await cookies();
    const guestId = getGuestIdFromCookie(cookieStore);

    const where: {
      pattern?: Pattern;
      difficulty?: Difficulty;
      isCurated?: boolean;
      title?: { contains: string; mode: 'insensitive' };
    } = {};

    if (pattern) {
      where.pattern = pattern;
    }

    if (difficulty) where.difficulty = difficulty;
    if (curated) where.isCurated = true;

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const orderBy = curated
      ? [{ curatedOrder: 'asc' as const }]
      : [{ difficulty: 'asc' as const }, { sortOrder: 'asc' as const }, { title: 'asc' as const }];

    const problems = await prisma.problem.findMany({
      where,
      orderBy,
      include: {
        _count: { select: { testCases: true } },
      },
    });

    let masteryMap: Record<string, string> = {};
    if (guestId) {
      const states = await prisma.userProblemState.findMany({
        where: { guestId },
        select: { problemId: true, mastery: true },
      });
      masteryMap = Object.fromEntries(
        states.map((s: { problemId: string; mastery: string }) => [s.problemId, s.mastery]),
      );
    }

    const result = problems.map((p: (typeof problems)[number]) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      pattern: p.pattern,
      curatedOrder: p.curatedOrder,
      testCaseCount: p._count.testCases,
      mastery: masteryMap[p.id] ?? null,
    }));

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, max-age=300, stale-while-revalidate=3600',
      },
    });
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'GET /api/problems');
  }
}
