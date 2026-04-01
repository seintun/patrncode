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

    return NextResponse.json({ dailyChallenge: problem ?? null });
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'GET /api/daily-challenge');
  }
}
