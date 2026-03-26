import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
    console.error('Hint persistence error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
