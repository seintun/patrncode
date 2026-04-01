import { type NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { generateText } from 'ai';
import { prisma } from '@/lib/db/prisma';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildSummaryPrompt } from '@/lib/ai/prompts/summary';
import { computeNextMastery, computeNextReviewDate } from '@/lib/mastery';
import { calculateStreak } from '@/lib/streak';
import type { MasteryState } from '@/generated/prisma/enums';
import { handleApiError, withAuthAndId } from '@/lib/errors/api';
import { requireOwnership } from '@/lib/auth/session-auth';

async function handler(
  _request: NextRequest,
  { params, guestId }: { params: Promise<{ id: string }>; guestId: string },
): Promise<Response> {
  try {
    const { id } = await params;
    await requireOwnership(id, guestId);

    const session = await prisma.session.findFirst({
      where: { id },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            slug: true,
            pattern: true,
            dailyChallengeDate: true,
          },
        },
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

    // Calculate mastery state (fast, no AI)
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

    // Mark session COMPLETED first (idempotent transition)
    const completionResult = await prisma.session.updateMany({
      where: {
        id,
        status: 'IN_PROGRESS',
      },
      data: {
        status: 'COMPLETED',
        outcome,
        completedAt: new Date(),
      },
    });

    if (completionResult.count === 0) {
      return NextResponse.json({ error: 'Session already finalized' }, { status: 400 });
    }

    // Return immediately - feedback will be generated in background
    const response = NextResponse.json({
      sessionId: id,
      outcome,
      feedback: null,
      stats: {
        timeSpentSeconds,
        hintsUsed,
        passed,
        total,
      },
      mastery: nextMastery,
      streak: null,
    });

    // Background tasks: AI feedback generation + secondary DB writes
    after(() =>
      generateBackgroundFeedback({
        sessionId: id,
        guestId: session.guestId,
        problemId: session.problemId,
        problem: session.problem,
        finalCode: session.code ?? latestRun?.code ?? '',
        passed,
        total,
        hintsUsed,
        timeSpentSeconds,
        solved,
        nextMastery,
        nextReviewAt,
        dailyChallengeDate: session.problem.dailyChallengeDate,
      }).catch((err) => console.error('Background feedback failed:', err)),
    );

    return response;
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

    const strengths = sections['strengths'] ?? sections['strength'] ?? '';
    const weaknesses = sections['areas for improvement'] ?? sections['weaknesses'] ?? '';
    const suggestions = sections['suggestions for next steps'] ?? sections['suggestions'] ?? '';
    const complexityNote = sections['complexity note'] ?? sections['complexity'] ?? '';

    if (!strengths && !weaknesses && !suggestions && !complexityNote) {
      return null;
    }

    // Ensure content is prepared for markdown parsing by adding leading/trailing newlines
    return {
      strengths: strengths ? `\n${strengths}\n` : '',
      weaknesses: weaknesses ? `\n${weaknesses}\n` : '',
      suggestions: suggestions ? `\n${suggestions}\n` : '',
      complexityNote: complexityNote ? `\n${complexityNote}\n` : '',
    };
  } catch {
    return null;
  }
}

async function generateBackgroundFeedback({
  sessionId,
  guestId,
  problemId,
  problem,
  finalCode,
  passed,
  total,
  hintsUsed,
  timeSpentSeconds,
  solved,
  nextMastery,
  nextReviewAt,
  dailyChallengeDate,
}: {
  sessionId: string;
  guestId: string;
  problemId: string;
  problem: { title: string; pattern: string; dailyChallengeDate: Date | null };
  finalCode: string;
  passed: number;
  total: number;
  hintsUsed: number;
  timeSpentSeconds: number;
  solved: boolean;
  nextMastery: MasteryState;
  nextReviewAt: Date;
  dailyChallengeDate: Date | null;
}) {
  // AI feedback generation
  let strengths = 'You showed persistence in working through the problem.';
  let weaknesses = 'Consider reviewing the core pattern concepts.';
  let suggestions = 'Practice similar problems to reinforce the pattern.';
  let complexityNote = 'Review the time and space complexity of your solution.';

  let aiFailed = false;
  if (process.env.OPENROUTER_API_KEY) {
    try {
      const { system, user } = buildSummaryPrompt({
        title: problem.title,
        pattern: problem.pattern,
        finalCode,
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
      aiFailed = true;
      console.error('AI summary generation failed, using fallback:', aiError);
    }
  }

  // Save feedback immediately (upsert to guard against race conditions)
  // This ensures feedback is always available even if subsequent DB operations fail
  await prisma.sessionFeedback.upsert({
    where: { sessionId },
    update: {
      strengths,
      weaknesses,
      suggestions,
      complexityNote,
    },
    create: {
      sessionId,
      strengths,
      weaknesses,
      suggestions,
      complexityNote,
    },
  });

  // Update user problem state and profile streak in parallel where possible
  const problemStatePromise = prisma.userProblemState.upsert({
    where: {
      guestId_problemId: {
        guestId,
        problemId,
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
      guestId,
      problemId,
      mastery: nextMastery,
      lastAttemptedAt: new Date(),
      nextReviewAt,
      attemptCount: 1,
      solveCount: solved ? 1 : 0,
    },
  });

  // Update profile streak (only if solved)
  const profilePromise = solved
    ? (async () => {
        const profile = await prisma.userProfile.findUnique({
          where: { guestId },
        });
        const streakResult = calculateStreak(
          profile?.lastActivityAt ?? null,
          profile?.streakLastWonAt ?? null,
          profile?.currentStreak ?? 0,
          profile?.longestStreak ?? 0,
        );

        const coinsEarned = 1;
        const isDailyChallenge = dailyChallengeDate != null;

        await prisma.userProfile.upsert({
          where: { guestId },
          create: {
            guestId,
            currentStreak: streakResult.current,
            longestStreak: streakResult.longest,
            lastActivityAt: streakResult.lastActivityAt,
            streakLastWonAt: new Date(),
            coins: isDailyChallenge ? coinsEarned + 10 : coinsEarned,
          },
          update: {
            currentStreak: streakResult.current,
            longestStreak: streakResult.longest,
            lastActivityAt: streakResult.lastActivityAt,
            streakLastWonAt: streakResult.wonToday ? undefined : new Date(),
            coins: { increment: isDailyChallenge ? coinsEarned + 10 : coinsEarned },
          },
        });
      })()
    : Promise.resolve();

  // Wait for both operations to complete
  await Promise.all([problemStatePromise, profilePromise]);

  if (aiFailed) {
    console.warn(
      `Background feedback for session ${sessionId} used fallback values due to AI failure`,
    );
  }
}

export const POST = withAuthAndId(handler);
