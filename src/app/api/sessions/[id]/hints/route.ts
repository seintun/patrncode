import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, withAuthAndId } from '@/lib/errors/api';
import { requireOwnership } from '@/lib/auth/session-auth';

async function handler(
  req: NextRequest,
  { params, guestId }: { params: Promise<{ id: string }>; guestId: string },
): Promise<Response> {
  try {
    const { id: sessionId } = await params;
    await requireOwnership(sessionId, guestId);

    const body = await req.json();
    const { level, content } = body;

    if (level === undefined || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: level, content' },
        { status: 400 },
      );
    }

    const hint = await prisma.hint.create({
      data: {
        sessionId,
        level,
        content,
      },
    });

    return NextResponse.json(hint, { status: 201 });
  } catch (error) {
    return handleApiError(
      new Response('', { status: 500 }),
      error,
      'POST /api/sessions/[id]/hints',
    );
  }
}

export const POST = withAuthAndId(handler);
