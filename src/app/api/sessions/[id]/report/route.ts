import { type NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import { withAuthAndId, handleApiError } from '@/lib/errors/api';
import { requireOwnership } from '@/lib/auth/session-auth';
import { prisma } from '@/lib/db/prisma';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildSummaryPrompt } from '@/lib/ai/prompts/summary';

const reportUpdateSchema = z.object({
  strengths: z.string().min(1),
  areasToImprove: z.string().default(''),
  nextSteps: z.string().default(''),
  complexityNote: z.string().default(''),
});

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSection(markdown: string, heading: string): string {
  const pattern = new RegExp(
    `##\\s+${escapeRegExp(heading)}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`,
    'i',
  );
  const match = markdown.match(pattern);
  return match?.[1]?.trim() ?? '';
}

function parseSummarySections(markdown: string): {
  strengths: string;
  areasToImprove: string;
  nextSteps: string;
  complexityNote: string;
} {
  const normalized = markdown.replace(/\r\n/g, '\n').trim();
  const strengths = extractSection(normalized, 'Strengths');
  const areasToImprove = extractSection(normalized, 'Areas for Improvement');
  const nextSteps = extractSection(normalized, 'Suggestions for Next Steps');
  const complexityNote = extractSection(normalized, 'Complexity Note');

  if (strengths || areasToImprove || nextSteps || complexityNote) {
    return {
      strengths,
      areasToImprove,
      nextSteps,
      complexityNote,
    };
  }

  return {
    strengths: normalized,
    areasToImprove: '',
    nextSteps: '',
    complexityNote: '',
  };
}

async function handler(
  _request: NextRequest,
  { params, guestId }: { params: Promise<{ id: string }>; guestId: string },
): Promise<Response> {
  try {
    const { id } = await params;
    await requireOwnership(id, guestId);

    const session = await prisma.session.findUnique({
      where: { id },
      include: {
        problem: { select: { title: true, pattern: true } },
        runs: { orderBy: { createdAt: 'desc' }, take: 1 },
        hints: { select: { id: true } },
        feedback: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.feedback) {
      return NextResponse.json({
        sessionId: id,
        report: {
          strengths: session.feedback.strengths,
          areasToImprove: session.feedback.weaknesses,
          nextSteps: session.feedback.suggestions,
          complexityNote: session.feedback.complexityNote,
        },
        cached: true,
      });
    }

    const latestRun = session.runs[0];
    const passed = latestRun?.passed ?? 0;
    const total = latestRun?.total ?? 0;
    const timeSpentSeconds = session.completedAt
      ? Math.max(
          0,
          Math.floor((session.completedAt.getTime() - session.startedAt.getTime()) / 1000),
        )
      : Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    const prompt = buildSummaryPrompt({
      title: session.problem.title,
      pattern: session.problem.pattern,
      finalCode: session.code ?? latestRun?.code ?? '',
      testResults: { passed, total },
      hintsUsed: session.hints.length,
      timeSpentSeconds,
      mode: session.mode,
    });

    const result = await generateText({
      model: openrouter(MODELS.summary),
      system: prompt.system,
      prompt: prompt.user,
    });

    const parsed = parseSummarySections(result.text);

    const feedback = await prisma.sessionFeedback.upsert({
      where: { sessionId: session.id },
      update: {
        strengths: parsed.strengths,
        weaknesses: parsed.areasToImprove,
        suggestions: parsed.nextSteps,
        complexityNote: parsed.complexityNote,
      },
      create: {
        sessionId: session.id,
        strengths: parsed.strengths,
        weaknesses: parsed.areasToImprove,
        suggestions: parsed.nextSteps,
        complexityNote: parsed.complexityNote,
      },
    });

    return NextResponse.json({
      sessionId: id,
      report: {
        strengths: feedback.strengths,
        areasToImprove: feedback.weaknesses,
        nextSteps: feedback.suggestions,
        complexityNote: feedback.complexityNote,
      },
      cached: false,
    });
  } catch (error) {
    return handleApiError(
      new Response('', { status: 500 }),
      error,
      'GET /api/sessions/[id]/report',
    );
  }
}

export const GET = withAuthAndId(handler);

async function patchHandler(
  request: NextRequest,
  { params, guestId }: { params: Promise<{ id: string }>; guestId: string },
): Promise<Response> {
  try {
    const { id } = await params;
    await requireOwnership(id, guestId);

    const body = await request.json();
    const parsed = reportUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.message }, { status: 400 });
    }

    const report = await prisma.sessionFeedback.upsert({
      where: { sessionId: id },
      update: {
        strengths: parsed.data.strengths,
        weaknesses: parsed.data.areasToImprove,
        suggestions: parsed.data.nextSteps,
        complexityNote: parsed.data.complexityNote,
      },
      create: {
        sessionId: id,
        strengths: parsed.data.strengths,
        weaknesses: parsed.data.areasToImprove,
        suggestions: parsed.data.nextSteps,
        complexityNote: parsed.data.complexityNote,
      },
    });

    return NextResponse.json({
      sessionId: id,
      report: {
        strengths: report.strengths,
        areasToImprove: report.weaknesses,
        nextSteps: report.suggestions,
        complexityNote: report.complexityNote,
      },
      saved: true,
    });
  } catch (error) {
    return handleApiError(
      new Response('', { status: 500 }),
      error,
      'PATCH /api/sessions/[id]/report',
    );
  }
}

export const PATCH = withAuthAndId(patchHandler);
