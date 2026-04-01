import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';

export async function GET(_request: NextRequest): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const guestId = getGuestIdFromCookie(cookieStore);

    if (!guestId) {
      return NextResponse.json({
        currentStreak: 0,
        longestStreak: 0,
        lastActivityAt: null,
        coins: 0,
        tier: 'FREE',
      });
    }

    const profile = await prisma.userProfile.findUnique({ where: { guestId } });

    return NextResponse.json({
      currentStreak: profile?.currentStreak ?? 0,
      longestStreak: profile?.longestStreak ?? 0,
      lastActivityAt: profile?.lastActivityAt?.toISOString() ?? null,
      coins: profile?.coins ?? 0,
      tier: profile?.tier ?? 'FREE',
    });
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'GET /api/user/profile');
  }
}
