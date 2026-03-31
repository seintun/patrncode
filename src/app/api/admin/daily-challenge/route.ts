import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/errors/api';

export async function GET(): Promise<Response> {
  try {
    const problem = await prisma.problem.findFirst({
      where: { dailyChallengeDate: { not: null } },
      select: {
        id: true,
        title: true,
        slug: true,
        difficulty: true,
        pattern: true,
      },
    });

    if (!problem) {
      return NextResponse.json({ dailyChallenge: null });
    }

    return NextResponse.json({ dailyChallenge: problem });
  } catch (error) {
    return handleApiError(
      new Response('', { status: 500 }),
      error,
      'GET /api/admin/daily-challenge',
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
    const adminSecret = process.env.ADMIN_SECRET;
    const isProd = process.env.NODE_ENV === 'production';

    if (isProd) {
      if (!adminSecret) {
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
      }
      const provided = request.headers.get('x-admin-secret');
      if (provided !== adminSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    } else if (adminSecret) {
      const provided = request.headers.get('x-admin-secret');
      if (provided !== adminSecret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Clear yesterday's daily challenge
    await prisma.problem.updateMany({
      where: { dailyChallengeDate: { not: null } },
      data: { dailyChallengeDate: null },
    });

    // Extract guest ID from header or request body
    let guestId: string | null = request.headers.get('x-guest-id');
    if (!guestId) {
      const body = await request.json().catch(() => ({}));
      guestId = (body as { guestId?: string }).guestId ?? null;
    }

    if (!guestId) {
      return NextResponse.json(
        { error: 'guestId is required (x-guest-id header or request body)' },
        { status: 400 },
      );
    }

    // Find problems this guest has solved in the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const attemptedToday = await prisma.userProblemState.findMany({
      where: {
        guestId,
        solveCount: { gt: 0 },
        lastAttemptedAt: { gte: twentyFourHoursAgo },
      },
      select: { problemId: true },
    });
    const attemptedIds = attemptedToday.map((s) => s.problemId);

    // Pick from curated problems not yet attempted
    const candidates = await prisma.problem.findMany({
      where: {
        isCurated: true,
        ...(attemptedIds.length > 0 ? { id: { notIn: attemptedIds } } : {}),
      },
      take: 10,
      orderBy: { createdAt: 'asc' },
    });

    if (candidates.length === 0) {
      return NextResponse.json({ error: 'no_candidates' }, { status: 400 });
    }

    const pick = candidates[Math.floor(Math.random() * candidates.length)];
    await prisma.problem.update({
      where: { id: pick.id },
      data: { dailyChallengeDate: new Date() },
    });

    return NextResponse.json({ problemId: pick.id, title: pick.title });
  } catch (error) {
    return handleApiError(
      new Response('', { status: 500 }),
      error,
      'POST /api/admin/daily-challenge',
    );
  }
}
