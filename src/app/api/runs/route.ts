import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, code, results, passed, total } = body as {
      sessionId: string;
      code: string;
      results: unknown;
      passed: number;
      total: number;
    };

    if (
      !sessionId ||
      code === undefined ||
      results === undefined ||
      passed === undefined ||
      total === undefined
    ) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, code, results, passed, total' },
        { status: 400 },
      );
    }

    const run = await prisma.testRun.create({
      data: {
        sessionId,
        code,
        results: results as object,
        passed,
        total,
      },
    });

    return NextResponse.json(run, { status: 201 });
  } catch (error) {
    console.error('Failed to create test run:', error);
    return NextResponse.json({ error: 'Failed to create test run' }, { status: 500 });
  }
}
