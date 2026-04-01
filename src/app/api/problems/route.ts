import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Pattern, Difficulty } from '@/generated/prisma/enums';
import { Prisma } from '@/generated/prisma/client';
import { handleApiError } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';
import { cleanupExpiredSessions } from '@/lib/session/expiry';

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
    } = {};

    if (pattern) {
      where.pattern = pattern;
    }

    if (difficulty) where.difficulty = difficulty;
    if (curated) where.isCurated = true;

    const orderBy = curated
      ? [{ curatedOrder: 'asc' as const }]
      : [{ difficulty: 'asc' as const }, { sortOrder: 'asc' as const }, { title: 'asc' as const }];

    const problems = search
      ? await (async () => {
          const patternFilter = pattern
            ? Prisma.sql`AND pattern = ${pattern}::"Pattern"`
            : Prisma.empty;
          const difficultyFilter = difficulty
            ? Prisma.sql`AND difficulty = ${difficulty}::"Difficulty"`
            : Prisma.empty;
          const curatedFilter = curated ? Prisma.sql`AND "isCurated" = true` : Prisma.empty;

          const ranked = await prisma.$queryRaw<Array<{ id: string }>>(Prisma.sql`
            SELECT id
            FROM "Problem"
            WHERE 1=1
            ${patternFilter}
            ${difficultyFilter}
            ${curatedFilter}
            AND (
              similarity(title, ${search}) > 0.1
              OR similarity(statement, ${search}) > 0.1
              OR title ILIKE ${`%${search}%`}
            )
            ORDER BY GREATEST(similarity(title, ${search}), similarity(statement, ${search})) DESC
            LIMIT 100
          `);

          const ids = ranked.map((row) => row.id);
          if (ids.length === 0) return [];

          const byId = new Map(
            (
              await prisma.problem.findMany({
                where: { id: { in: ids } },
                include: {
                  _count: { select: { testCases: true } },
                },
              })
            ).map((problem) => [problem.id, problem]),
          );

          return ids.map((id) => byId.get(id)).filter((problem) => problem != null);
        })()
      : await prisma.problem.findMany({
          where,
          orderBy,
          include: {
            _count: { select: { testCases: true } },
          },
        });

    let masteryMap: Record<string, string> = {};
    const sessionStatusMap: Record<string, 'ACTIVE' | 'ABANDONED' | null> = {};
    if (guestId) {
      cleanupExpiredSessions(guestId).catch((err) => {
        console.error('Failed to clean up expired sessions for guest', guestId, err);
      });

      const states = await prisma.userProblemState.findMany({
        where: { guestId },
        select: { problemId: true, mastery: true },
      });

      const latestSessions = await prisma.session.findMany({
        where: {
          guestId,
          problemId: { in: problems.map((problem) => problem.id) },
        },
        orderBy: { startedAt: 'desc' },
        select: {
          problemId: true,
          status: true,
          expiresAt: true,
        },
      });

      masteryMap = Object.fromEntries(
        states.map((s: { problemId: string; mastery: string }) => [s.problemId, s.mastery]),
      );

      const now = Date.now();
      for (const session of latestSessions) {
        if (sessionStatusMap[session.problemId] !== undefined) {
          continue;
        }

        if (
          session.status === 'IN_PROGRESS' &&
          (session.expiresAt == null || session.expiresAt.getTime() > now)
        ) {
          sessionStatusMap[session.problemId] = 'ACTIVE';
          continue;
        }

        if (
          session.status === 'ABANDONED' ||
          (session.status === 'IN_PROGRESS' &&
            session.expiresAt != null &&
            session.expiresAt.getTime() <= now)
        ) {
          sessionStatusMap[session.problemId] = 'ABANDONED';
          continue;
        }

        sessionStatusMap[session.problemId] = null;
      }
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
      sessionStatus: sessionStatusMap[p.id] ?? null,
    }));

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'GET /api/problems');
  }
}
