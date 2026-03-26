import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { SessionMode } from '@/generated/prisma/enums';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestId, problemId, mode } = body as {
      guestId: string;
      problemId: string;
      mode: SessionMode;
    };

    if (!guestId || !problemId || !mode) {
      return NextResponse.json(
        { error: 'Missing required fields: guestId, problemId, mode' },
        { status: 400 },
      );
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
