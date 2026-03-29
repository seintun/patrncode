import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { SessionMode } from '@/generated/prisma/enums';
import { withAuth, validateId } from '@/lib/errors/api';

async function handler(request: NextRequest, { guestId }: { guestId: string }): Promise<Response> {
  try {
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

    if (!validateId(problemId)) {
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

export const POST = withAuth(handler);
