import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Pattern, Difficulty } from '@/generated/prisma/enums';
import { handleApiError } from '@/lib/errors/api';

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pattern = searchParams.get('pattern') as Pattern | null;
    const difficulty = searchParams.get('difficulty') as Difficulty | null;
    const search = searchParams.get('search') || '';
    const guestId = searchParams.get('guestId') || '';

    const where: {
      pattern?: Pattern;
      difficulty?: Difficulty;
      title?: { contains: string; mode: 'insensitive' };
    } = {};

    if (pattern) {
      where.pattern = pattern;
    }

    if (difficulty) where.difficulty = difficulty;

    if (search) {
      where.title = { contains: search, mode: 'insensitive' };
    }

    const problems = await prisma.problem.findMany({
      where,
      orderBy: [{ difficulty: 'asc' }, { sortOrder: 'asc' }, { title: 'asc' }],
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
      testCaseCount: p._count.testCases,
      mastery: masteryMap[p.id] ?? null,
    }));

    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'GET /api/problems');
  }
}
