import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/errors/api';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await params;
    const body = await request.json();
    const { code } = body as { code: string };

    if (!code) {
      return NextResponse.json({ error: 'Missing code in request body' }, { status: 400 });
    }

    const session = await prisma.session.update({
      where: { id },
      data: { code },
      select: { id: true, code: true },
    });

    return NextResponse.json(session);
  } catch (error) {
    return handleApiError(
      new Response('', { status: 500 }),
      error,
      'PATCH /api/sessions/[id]/snapshot',
    );
  }
}
