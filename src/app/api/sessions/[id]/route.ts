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
          },
        },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
        hints: {
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
    const { status, code, outcome } = body as {
      status?: SessionStatus;
      code?: string;
      outcome?: SessionOutcome;
    };

    const session = await prisma.session.update({
      where: { id },
      data: {
        status,
        code,
        outcome,
        completedAt: status === 'COMPLETED' ? new Date() : undefined,
      },
    });

    return NextResponse.json(session);
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'PATCH /api/sessions/[id]');
  }
}

export const GET = withAuthAndId(getHandler);
export const PATCH = withAuthAndId(patchHandler);
