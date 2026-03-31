import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { SessionStatus, SessionOutcome } from '@/generated/prisma/enums';
import { handleApiError, withAuthAndId } from '@/lib/errors/api';
import { requireOwnership } from '@/lib/auth/session-auth';

async function getHandler(
  _request: NextRequest,
  { params, guestId }: { params: Promise<{ id: string }>; guestId: string },
): Promise<Response> {
  try {
    const { id } = await params;
    await requireOwnership(id, guestId);

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            statement: true,
            examples: true,
            constraints: true,
            starterCode: true,
            difficulty: true,
            pattern: true,
            testCases: {
              select: {
                id: true,
                input: true,
                expected: true,
                isHidden: true,
              },
              orderBy: { order: 'asc' },
            },
          },
        },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        hints: {
          orderBy: { createdAt: 'asc' },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json(session);
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'GET /api/sessions/[id]');
  }
}

async function patchHandler(
  request: NextRequest,
  { params, guestId }: { params: Promise<{ id: string }>; guestId: string },
): Promise<Response> {
  try {
    const { id } = await params;
    await requireOwnership(id, guestId);

    const body = await request.json();
    const { status, code, outcome, extend } = body as {
      status?: SessionStatus;
      code?: string;
      outcome?: SessionOutcome;
      extend?: boolean;
    };

    // Prepare update data
    const data: any = {
      status,
      code,
      outcome,
      completedAt: status === 'COMPLETED' ? new Date() : undefined,
    };

    // Handle extension
    if (extend) {
      const currentSession = await prisma.session.findUnique({
        where: { id },
        select: { expiresAt: true, status: true },
      });

      if (!currentSession) {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 });
      }

      if (currentSession.status !== 'IN_PROGRESS') {
        return NextResponse.json({ error: 'Cannot extend a non-active session' }, { status: 400 });
      }

      const currentExpiresAt = currentSession.expiresAt || new Date();
      const baseTime = Math.max(Date.now(), currentExpiresAt.getTime());
      data.expiresAt = new Date(baseTime + 15 * 60 * 1000);
      data.duration = { increment: 15 };
    }

    const session = await prisma.session.update({
      where: { id },
      data,
    });

    return NextResponse.json(session);
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'PATCH /api/sessions/[id]');
  }
}

export const GET = withAuthAndId(getHandler);
export const PATCH = withAuthAndId(patchHandler);
