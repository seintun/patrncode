import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/errors/api';
import { requireAdminSecret } from '@/lib/auth/admin';

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
    const authError = requireAdminSecret(request);
    if (authError) return authError;

    // Clear yesterday's daily challenge
    await prisma.problem.updateMany({
      where: { dailyChallengeDate: { not: null } },
      data: { dailyChallengeDate: null },
    });

    const candidates = await prisma.problem.findMany({
      where: { isCurated: true },
      take: 20,
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
