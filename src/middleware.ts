import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGuestIdFromCookie } from '@/lib/guest';

const PREMIUM_ROUTES = [
  '/api/ai/generate-problem',
  '/api/session/report',
  '/api/recommendations/next',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!PREMIUM_ROUTES.some((r) => pathname.startsWith(r))) {
    return NextResponse.next();
  }

  const cookieStore = await cookies();
  const guestId = getGuestIdFromCookie(cookieStore);

  if (!guestId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prisma } = await import('@/lib/db/prisma');
  const profile = await prisma.userProfile.findUnique({ where: { guestId } });

  if (!profile || profile.tier !== 'PREMIUM') {
    return NextResponse.json(
      { error: 'premium_required', upgradeUrl: '/account/subscribe' },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/ai/generate-problem', '/api/session/report', '/api/recommendations/next'],
};
