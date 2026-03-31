import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  // Admin auth check in production
  if (process.env.ADMIN_SECRET) {
    if (request.headers.get('x-admin-secret') !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }
  }

  const cookieStore = await cookies();
  const guestId = getGuestIdFromCookie(cookieStore);

  if (!guestId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Mock upgrade — in production this would be a Stripe webhook
  const profile = await prisma.userProfile.upsert({
    where: { guestId },
    create: { guestId, tier: 'PREMIUM' },
    update: { tier: 'PREMIUM' },
  });

  return NextResponse.json({ tier: profile.tier });
}
