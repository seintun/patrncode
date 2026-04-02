import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { Pattern, Difficulty } from '@/generated/prisma/enums';
import { Prisma } from '@/generated/prisma/client';
import { handleApiError } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';
import { cleanupExpiredSessions } from '@/lib/session/expiry';

let dbPatternCache: Set<string> | null = null;
const DIFFICULTY_VALUES = new Set<Difficulty>(['EASY', 'MEDIUM', 'HARD']);

function escapeLikeTerm(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
}

async function getDbPatternValues(): Promise<Set<string>> {
  if (dbPatternCache) return dbPatternCache;

  const rows = await prisma.$queryRaw<Array<{ value: string }>>(Prisma.sql`
    SELECT unnest(enum_range(NULL::"Pattern"))::text AS value
  `);
  dbPatternCache = new Set(rows.map((row) => row.value));
  return dbPatternCache;
}

export async function GET(request: NextRequest): Promise<Response> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const pattern = searchParams.get('pattern') as Pattern | null;
    const difficulty = searchParams.get('difficulty') as Difficulty | null;
    const rawSearch = searchParams.get('search') ?? '';
    const search = rawSearch.trim().slice(0, 120);
    const escapedSearch = escapeLikeTerm(search);
    const curated = searchParams.get('curated') === 'true';

    const cookieStore = await cookies();
    const guestId = getGuestIdFromCookie(cookieStore);

    const dbPatternValues = await getDbPatternValues();
    const safePattern = pattern && dbPatternValues.has(pattern) ? pattern : null;
    const safeDifficulty = difficulty && DIFFICULTY_VALUES.has(difficulty) ? difficulty : null;
    const searchContains = `%${escapedSearch}%`;
    const useFuzzySearch = search.length >= 3;

    const patternFilter = safePattern
      ? Prisma.sql`AND p.pattern = ${safePattern}::"Pattern"`
      : Prisma.empty;
    const difficultyFilter = safeDifficulty
      ? Prisma.sql`AND p.difficulty = ${safeDifficulty}::"Difficulty"`
      : Prisma.empty;
    const curatedFilter = curated ? Prisma.sql`AND p."isCurated" = true` : Prisma.empty;

    type ProblemRow = {
      id: string;
      title: string;
      slug: string;
      difficulty: Difficulty;
      pattern: string;
      leetcodeNumber: number | null;
      curatedOrder: number | null;
      testCaseCount: number;
    };

    const problems = search
      ? await prisma.$queryRaw<ProblemRow[]>(Prisma.sql`
          WITH ranked AS (
            SELECT p.id,
              ROW_NUMBER() OVER (
                ORDER BY
                  ${
                    useFuzzySearch
                      ? Prisma.sql`GREATEST(similarity(p.title, ${search}), similarity(p.statement, ${search})) DESC`
                      : Prisma.sql`CASE
                        WHEN lower(p.title) = lower(${search}) THEN 400
                        WHEN p.title ILIKE ${`${escapedSearch}%`} ESCAPE '\\' THEN 300
                        WHEN p.title ILIKE ${searchContains} ESCAPE '\\' THEN 200
                        ELSE 100
                      END DESC`
                  }
              ) AS rank
            FROM "Problem" p
            WHERE 1=1
              ${patternFilter}
              ${difficultyFilter}
              ${curatedFilter}
              AND (
                ${
                  useFuzzySearch
                    ? Prisma.sql`(
                      similarity(p.title, ${search}) > 0.1
                      OR similarity(p.statement, ${search}) > 0.1
                      OR p.title ILIKE ${searchContains} ESCAPE '\\'
                    )`
                    : Prisma.sql`p.title ILIKE ${searchContains} ESCAPE '\\'`
                }
              )
            LIMIT 100
          )
          SELECT
            p.id,
            p.title,
            p.slug,
            p.difficulty,
            p.pattern::text AS pattern,
            p."leetcodeNumber",
            p."curatedOrder",
            COALESCE(tc.count, 0)::int AS "testCaseCount"
          FROM ranked r
          JOIN "Problem" p ON p.id = r.id
          LEFT JOIN LATERAL (
            SELECT COUNT(*)::int AS count
            FROM "TestCase" tc
            WHERE tc."problemId" = p.id
          ) tc ON true
          ORDER BY r.rank ASC
        `)
      : await prisma.$queryRaw<ProblemRow[]>(Prisma.sql`
          SELECT
            p.id,
            p.title,
            p.slug,
            p.difficulty,
            p.pattern::text AS pattern,
            p."leetcodeNumber",
            p."curatedOrder",
            COALESCE(tc.count, 0)::int AS "testCaseCount"
          FROM "Problem" p
           LEFT JOIN LATERAL (
             SELECT COUNT(*)::int AS count
             FROM "TestCase" tc
             WHERE tc."problemId" = p.id
           ) tc ON true
          WHERE 1=1
            ${patternFilter}
            ${difficultyFilter}
            ${curatedFilter}
          ORDER BY
            ${curated ? Prisma.sql`p."curatedOrder" ASC,` : Prisma.empty}
            ${curated ? Prisma.empty : Prisma.sql`p.difficulty ASC, p."sortOrder" ASC,`}
            p.title ASC
        `);

    let masteryMap: Record<string, string> = {};
    const sessionStatusMap: Record<string, 'ACTIVE' | 'ABANDONED' | null> = {};
    if (guestId) {
      cleanupExpiredSessions(guestId).catch((err) => {
        console.error('Failed to clean up expired sessions for guest', guestId, err);
      });

      const problemIds = problems.map((problem) => problem.id);
      const [states, latestSessions] =
        problemIds.length > 0
          ? await Promise.all([
              prisma.userProblemState.findMany({
                where: {
                  guestId,
                  problemId: { in: problemIds },
                },
                select: { problemId: true, mastery: true },
              }),
              prisma.session.findMany({
                where: {
                  guestId,
                  problemId: { in: problemIds },
                },
                orderBy: [{ problemId: 'asc' }, { startedAt: 'desc' }],
                distinct: ['problemId'],
                select: {
                  problemId: true,
                  status: true,
                  expiresAt: true,
                },
              }),
            ])
          : [[], []];

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

    const result = problems.map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      difficulty: p.difficulty,
      pattern: p.pattern,
      leetcodeNumber: p.leetcodeNumber,
      curatedOrder: p.curatedOrder,
      testCaseCount: p.testCaseCount,
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
