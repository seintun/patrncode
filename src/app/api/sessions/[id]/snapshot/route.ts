import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, withValidIdParams } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';
import { requireOwnership } from '@/lib/auth/session-auth';

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const guestId = getGuestIdFromCookie(cookieStore);

    if (!guestId) {
      return NextResponse.json({ error: 'Unauthorized: Guest ID missing' }, { status: 401 });
    }

    await requireOwnership(id, guestId);

    const body = await request.json();
    const { code } = body as { code: string };

    if (!code) {
      return NextResponse.json({ error: 'Missing code in request body' }, { status: 400 });
    }

    const session = await prisma.session.update({
      where: { id },
      data: { code },
    });

    return NextResponse.json(session);
  } catch (error) {
    return handleApiError(
      new Response('', { status: 500 }),
      error,
      'PATCH /api/sessions/[id]/snapshot',
    );
  }
}

export const PATCH = withValidIdParams(handler);
