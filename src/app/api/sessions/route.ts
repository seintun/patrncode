import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { SessionMode } from '@/generated/prisma/enums';
import { withErrorHandling, validateUUID } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';

async function handler(request: NextRequest): Promise<Response> {
  try {
    const cookieStore = await cookies();
    const guestId = getGuestIdFromCookie(cookieStore);

    if (!guestId) {
      return NextResponse.json({ error: 'Unauthorized: Guest ID missing' }, { status: 401 });
    }

    const body = await request.json();
    const { problemId, mode } = body as {
      problemId: string;
      mode: SessionMode;
    };

    if (!problemId || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: problemId, mode' },
        { status: 400 },
      );
    }

    if (!validateUUID(problemId)) {
      return NextResponse.json({ error: 'Invalid problemId format' }, { status: 400 });
    }

    const session = await prisma.session.create({
      data: {
        guestId,
        problemId,
        mode,
      },
      select: { id: true },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

export const POST = withErrorHandling(handler);
