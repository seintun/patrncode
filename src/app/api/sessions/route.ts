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

    // Check for existing active session for this problem
    const activeSession = await prisma.session.findFirst({
      where: {
        guestId,
        problemId,
        status: 'IN_PROGRESS',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
      },
      select: { 
        id: true, 
        mode: true 
      },
    });

    if (activeSession) {
      return NextResponse.json(
        {
          error: 'An active session already exists for this problem.',
          sessionId: activeSession.id,
          mode: activeSession.mode,
        },
        { status: 409 },
      );
    }

    const duration = 45;
    const expiresAt = new Date(Date.now() + duration * 60 * 1000);

    const session = await prisma.session.create({
      data: {
        guestId,
        problemId,
        mode,
        duration,
        expiresAt,
      },
      select: { id: true },
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error('Failed to create session:', error);
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
  }
}

async function getHandler(request: NextRequest, { guestId }: { guestId: string }): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const problemId = searchParams.get('problemId');

    if (!problemId) {
      return NextResponse.json({ error: 'Missing problemId parameter' }, { status: 400 });
    }

    const session = await prisma.session.findFirst({
      where: {
        guestId,
        problemId,
        status: 'IN_PROGRESS',
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } }
        ],
      },
      select: {
        id: true,
        mode: true,
        startedAt: true,
        expiresAt: true,
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error('Failed to fetch active session:', error);
    return NextResponse.json({ error: 'Failed to fetch active session' }, { status: 500 });
  }
}

export const POST = withAuth(handler);
export const GET = withAuth(getHandler);
