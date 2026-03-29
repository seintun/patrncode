import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { SessionStatus, SessionOutcome } from '@/generated/prisma/enums';
import { handleApiError, withValidIdParams } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';
import { requireOwnership } from '@/lib/auth/session-auth';

async function getHandler(
  _request: NextRequest,
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

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            statement: true,
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

export const GET = withValidIdParams(getHandler);
export const PATCH = withValidIdParams(patchHandler);
