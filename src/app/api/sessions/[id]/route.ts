import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { SessionStatus, SessionOutcome } from '@/generated/prisma/enums';
import { handleApiError, withUUIDParams } from '@/lib/errors/api';
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

    await requireOwnership(id, guestId);

    const session = await prisma.session.findFirst({
      where: { id },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            difficulty: true,
            pattern: true,
            testCases: {
              where: { isHidden: false },
              select: { id: true, input: true, expected: true },
              orderBy: { order: 'asc' },
            },
          },
        },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, passed: true, total: true, createdAt: true },
        },
        hints: {
          orderBy: { createdAt: 'asc' },
          select: { id: true, level: true, content: true, createdAt: true },
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

    await requireOwnership(id, guestId);

    const body = await request.json();
    const { code, status, outcome } = body as {
      code?: string;
      status?: SessionStatus;
      outcome?: SessionOutcome;
    };

    const data: Record<string, unknown> = {};
    if (code !== undefined) data.code = code;
    if (status !== undefined) data.status = status;
    if (outcome !== undefined) data.outcome = outcome;
    if (status === 'COMPLETED') data.completedAt = new Date();

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const session = await prisma.session.update({
      where: { id },
      data,
      select: { id: true, status: true, outcome: true },
    });

    return NextResponse.json(session);
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'PATCH /api/sessions/[id]');
  }
}

export const GET = withUUIDParams(getHandler);
export const PATCH = withUUIDParams(patchHandler);
