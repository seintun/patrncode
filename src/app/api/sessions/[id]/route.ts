import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import type { SessionStatus, SessionOutcome } from '@/generated/prisma/enums';
import { handleApiError } from '@/lib/errors/api';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;

    const session = await prisma.session.findFirst({
      where: { id },
      include: {
        problem: {
          include: {
            testCases: {
              where: { isHidden: false },
              orderBy: { order: 'asc' },
            },
          },
        },
        runs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
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
