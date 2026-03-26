import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/errors/api';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id: sessionId } = await params;
    const body = await req.json();
    const { level, content } = body;

    if (level === undefined || !content) {
      return NextResponse.json(
        { error: 'Missing required fields: level, content' },
        { status: 400 },
      );
    }

    if (![1, 2, 3].includes(level)) {
      return NextResponse.json(
        { error: 'Invalid hint level. Must be 1, 2, or 3.' },
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
