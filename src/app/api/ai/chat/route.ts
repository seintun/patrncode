import { streamText, convertToModelMessages } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildCoachPrompt } from '@/lib/ai/prompts/coach';
import { buildInterviewerPrompt } from '@/lib/ai/prompts/interviewer';
import { handleApiError } from '@/lib/errors/api';
import { withRateLimit } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';
import { checkTokenBudget, recordTokenUsage } from '@/lib/ai/token-counter';
import { TOKEN_ESTIMATE_PER_MESSAGE } from '@/lib/config';
import { logInfo, logError } from '@/lib/log';

async function handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('AI features temporarily unavailable', { status: 503 });
    }

    const body = await req.json();
    const {
      messages,
      mode,
      sessionMode,
      title,
      statement,
      pattern,
      difficulty,
      sessionId: _sessionId,
      currentCode,
    } = body as Record<string, unknown>;

    // Validate required fields
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'messages: must be an array' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (mode !== 'coach' && mode !== 'interviewer') {
      return new Response('Invalid mode. Must be "coach" or "interviewer".', { status: 400 });
    }
    if (!title || typeof title !== 'string') {
      return new Response(JSON.stringify({ error: 'title: required string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!statement || typeof statement !== 'string') {
      return new Response(JSON.stringify({ error: 'statement: required string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!pattern || typeof pattern !== 'string') {
      return new Response(JSON.stringify({ error: 'pattern: required string' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!difficulty || !['EASY', 'MEDIUM', 'HARD'].includes(difficulty as string)) {
      return new Response(JSON.stringify({ error: 'difficulty: must be EASY, MEDIUM, or HARD' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Guest ID from cookie or anonymous
    const guestId = req.cookies.get('sophocode_guest')?.value ?? 'anonymous';

    // Check token budget
    const budget = await checkTokenBudget(guestId);
    if (!budget.allowed) {
      return new Response(
        JSON.stringify({
          error: 'token_limit_exceeded',
          tokensUsed: budget.tokensUsed,
          tokenLimit: budget.tokenLimit,
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const promptInput = {
      title: title as string,
      statement: statement as string,
      pattern: pattern as string,
      difficulty: difficulty as string,
      currentCode: currentCode as string | undefined,
      sessionMode:
        (sessionMode as 'SELF_PRACTICE' | 'COACH_ME' | 'MOCK_INTERVIEW' | undefined) ?? undefined,
    };
    const { system } =
      mode === 'coach' ? buildCoachPrompt(promptInput) : buildInterviewerPrompt(promptInput);

    const modelMessages = convertToModelMessages(
      messages as Parameters<typeof convertToModelMessages>[0],
    );

    const result = streamText({
      model: openrouter(MODELS.reasoning),
      system,
      messages: await modelMessages,
    });

    logInfo('AI chat request', {
      route: 'POST /api/ai/chat',
      guestId,
      model: MODELS.reasoning,
      mode: mode as string,
      statusCode: 200,
      latencyMs: Date.now() - startTime,
    });

    recordTokenUsage(guestId, TOKEN_ESTIMATE_PER_MESSAGE).catch((err) => {
      logError('Failed to record token usage', {
        guestId,
        error: err instanceof Error ? err.message : String(err),
      });
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError('AI chat error', {
      route: 'POST /api/ai/chat',
      error: error instanceof Error ? error.message : String(error),
      latencyMs: Date.now() - startTime,
    });
    return handleApiError(new Response('', { status: 500 }), error, 'POST /api/ai/chat');
  }
}

export const POST = withRateLimit(handler);
