import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';
import { z } from 'zod';

const profileSettingsSchema = z.object({
  theme: z.enum(['DARK', 'LIGHT', 'SYSTEM']).optional(),
  fontSize: z.enum(['SMALL', 'MEDIUM', 'LARGE']).optional(),
  keybindingScheme: z.enum(['VSCODE', 'VIM', 'EMACS', 'NONE']).optional(),
});

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
        theme: 'SYSTEM',
        fontSize: 'MEDIUM',
        keybindingScheme: 'VSCODE',
      });
    }

    const profile = await prisma.userProfile.findUnique({ where: { guestId } });

    return NextResponse.json({
      currentStreak: profile?.currentStreak ?? 0,
      longestStreak: profile?.longestStreak ?? 0,
      lastActivityAt: profile?.lastActivityAt?.toISOString() ?? null,
      coins: profile?.coins ?? 0,
      tier: profile?.tier ?? 'FREE',
      theme: profile?.theme ?? 'SYSTEM',
      fontSize: profile?.fontSize ?? 'MEDIUM',
      keybindingScheme: profile?.keybindingScheme ?? 'VSCODE',
    });
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'GET /api/user/profile');
  }
}

export async function PATCH(request: NextRequest): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const guestId = getGuestIdFromCookie(cookieStore);
    if (!guestId) {
      return NextResponse.json({ error: 'Unauthorized: Guest ID missing' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = profileSettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const profile = await prisma.userProfile.upsert({
      where: { guestId },
      create: {
        guestId,
        ...parsed.data,
      },
      update: parsed.data,
      select: {
        theme: true,
        fontSize: true,
        keybindingScheme: true,
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'PATCH /api/user/profile');
  }
}
