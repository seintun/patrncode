import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, withAuthAndId } from '@/lib/errors/api';
import { requireOwnership } from '@/lib/auth/session-auth';

async function handler(
  request: NextRequest,
  { params, guestId }: { params: Promise<{ id: string }>; guestId: string },
): Promise<Response> {
  try {
    const { id } = await params;
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

export const PATCH = withAuthAndId(handler);
