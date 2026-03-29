import { type NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { prisma } from '@/lib/db/prisma';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildSummaryPrompt } from '@/lib/ai/prompts/summary';
import { computeNextMastery, computeNextReviewDate } from '@/lib/mastery';
import type { MasteryState } from '@/generated/prisma/enums';
import { handleApiError, withUUIDParams } from '@/lib/errors/api';
import { getGuestIdFromCookie } from '@/lib/guest';
import { cookies } from 'next/headers';
import { requireOwnership } from '@/lib/auth/session-auth';

async function handler(
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
        problem: true,
        runs: { orderBy: { createdAt: 'desc' }, take: 1 },
        hints: true,
        feedback: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Session already completed' }, { status: 400 });
    }

    const latestRun = session.runs[0];
    const passed = latestRun?.passed ?? 0;
    const total = latestRun?.total ?? 0;

    let outcome: 'SOLVED' | 'PARTIALLY_SOLVED' | 'NOT_SOLVED';
    if (total > 0 && passed === total) {
      outcome = 'SOLVED';
    } else if (passed > 0) {
      outcome = 'PARTIALLY_SOLVED';
    } else {
      outcome = 'NOT_SOLVED';
    }

    const hintsUsed = session.hints.length;
    const timeSpentSeconds = session.completedAt
      ? 0
      : Math.floor((Date.now() - session.startedAt.getTime()) / 1000);

    let strengths = 'You showed persistence in working through the problem.';
    let weaknesses = 'Consider reviewing the core pattern concepts.';
    let suggestions = 'Practice similar problems to reinforce the pattern.';
    let complexityNote = 'Review the time and space complexity of your solution.';

    if (process.env.OPENROUTER_API_KEY) {
      try {
        const { system, user } = buildSummaryPrompt({
          title: session.problem.title,
          pattern: session.problem.pattern,
          finalCode: session.code ?? latestRun?.code ?? '',
          testResults: { passed, total },
          hintsUsed,
          timeSpentSeconds,
        });

        const result = await generateText({
          model: openrouter(MODELS.summary),
          system,
          prompt: user,
        });

        const parsed = parseSummarySections(result.text);
        if (parsed) {
          ({ strengths, weaknesses, suggestions, complexityNote } = parsed);
        }
      } catch (aiError) {
        console.error('AI summary generation failed, using fallback:', aiError);
      }
    }

    if (!session.feedback) {
      await prisma.sessionFeedback.create({
        data: {
          sessionId: id,
          strengths,
          weaknesses,
          suggestions,
          complexityNote,
        },
      });
    }

    const solved = outcome === 'SOLVED';
    const existingState = await prisma.userProblemState.findFirst({
      where: {
        guestId: session.guestId,
        problemId: session.problemId,
      },
    });

    const currentState: MasteryState = (existingState?.mastery as MasteryState) ?? 'UNSEEN';
    const nextMastery = computeNextMastery({
      currentState,
      solved,
      hintsUsed,
      lastSolvedAt: existingState?.lastAttemptedAt,
    });
    const nextReviewAt = computeNextReviewDate(nextMastery);

    await prisma.userProblemState.upsert({
      where: {
        guestId_problemId: {
          guestId: session.guestId,
          problemId: session.problemId,
        },
      },
      update: {
        mastery: nextMastery,
        lastAttemptedAt: new Date(),
        nextReviewAt,
        attemptCount: { increment: 1 },
        solveCount: solved ? { increment: 1 } : undefined,
      },
      create: {
        guestId: session.guestId,
        problemId: session.problemId,
        mastery: nextMastery,
        lastAttemptedAt: new Date(),
        nextReviewAt,
        attemptCount: 1,
        solveCount: solved ? 1 : 0,
      },
    });

    const updatedSession = await prisma.session.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        outcome,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      sessionId: updatedSession.id,
      outcome,
      feedback: { strengths, weaknesses, suggestions, complexityNote },
      stats: {
        timeSpentSeconds,
        hintsUsed,
        passed,
        total,
      },
      mastery: nextMastery,
    });
  } catch (error) {
    return handleApiError(
      new Response('', { status: 500 }),
      error,
      'POST /api/sessions/[id]/complete',
    );
  }
}

function parseSummarySections(text: string): {
  strengths: string;
  weaknesses: string;
  suggestions: string;
  complexityNote: string;
} | null {
  try {
    const sections: Record<string, string> = {};
    const sectionRegex = /##\s*(.+?)\n([\s\S]*?)(?=\n##\s|$)/g;
    let match;

    while ((match = sectionRegex.exec(text)) !== null) {
      const heading = match[1].trim().toLowerCase();
      const content = match[2].trim();
      sections[heading] = content;
    }

    const strengths = sections['strengths'] ?? sections['strengths'] ?? '';
    const weaknesses = sections['areas for improvement'] ?? sections['weaknesses'] ?? '';
    const suggestions = sections['suggestions for next steps'] ?? sections['suggestions'] ?? '';
    const complexityNote = sections['complexity note'] ?? sections['complexity'] ?? '';

    if (!strengths && !weaknesses && !suggestions && !complexityNote) {
      return null;
    }

    return { strengths, weaknesses, suggestions, complexityNote };
  } catch {
    return null;
  }
}

export const POST = withUUIDParams(handler);
