import { streamText, convertToModelMessages } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildCoachPrompt } from '@/lib/ai/prompts/coach';
import { buildInterviewerPrompt } from '@/lib/ai/prompts/interviewer';
import { handleApiError } from '@/lib/errors/api';
import { withRateLimit } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';
import { chatRequestSchema, validateBody } from '@/lib/validations';
import { Redis } from '@upstash/redis';
import { checkTokenBudget } from '@/lib/ai/token-counter';
import { logInfo, logError } from '@/lib/log';

let redis: Redis | null = null;
try {
  redis = Redis.fromEnv();
} catch {
  // Redis unavailable — caching disabled
}

function getCacheKey(guestId: string, messageContent: string): string {
  const hash = [...messageContent].reduce((h, c) => ((h << 5) - h + c.charCodeAt(0)) | 0, 0);
  return `ai:chat:${guestId}:${Math.abs(hash)}`;
}

async function handler(req: NextRequest): Promise<Response> {
  const startTime = Date.now();
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('AI features temporarily unavailable', { status: 503 });
    }

    const body = await req.json();
    const validation = validateBody(chatRequestSchema, body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const {
      messages,
      mode,
      title,
      statement,
      pattern,
      difficulty,
      sessionId: _sessionId,
      currentCode,
    } = validation.data;

    if (mode !== 'coach' && mode !== 'interviewer') {
      return new Response('Invalid mode. Must be "coach" or "interviewer".', { status: 400 });
    }

    // Guest ID from header or generate one
    const guestId = req.headers.get('x-guest-id') ?? 'anonymous';

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

    // Check Redis cache for identical last message (non-personalized responses only)
    const lastMessage = messages[messages.length - 1];
    if (redis && lastMessage?.role === 'user') {
      const cacheKey = getCacheKey(guestId, lastMessage.content);
      const cached = await redis.get<string>(cacheKey);
      if (cached) {
        return new Response(cached, {
          headers: {
            'Content-Type': 'text/plain; charset=utf-8',
            'X-Cache': 'HIT',
          },
        });
      }
    }

    const promptInput = { title, statement, pattern, difficulty, currentCode };
    const { system } =
      mode === 'coach' ? buildCoachPrompt(promptInput) : buildInterviewerPrompt(promptInput);

    // TODO: Streaming responses are not cached — caching would require collecting the full response first.

    const result = streamText({
      model: openrouter(MODELS.reasoning),
      system,
      messages: await convertToModelMessages(messages),
    });

    logInfo('AI chat request', {
      route: 'POST /api/ai/chat',
      guestId,
      model: MODELS.reasoning,
      mode,
      statusCode: 200,
      latencyMs: Date.now() - startTime,
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
