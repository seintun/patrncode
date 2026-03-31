import { streamText, convertToModelMessages } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildCoachPrompt } from '@/lib/ai/prompts/coach';
import { buildInterviewerPrompt } from '@/lib/ai/prompts/interviewer';
import { handleApiError } from '@/lib/errors/api';
import { withRateLimit } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';
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

/**
 * Extract plain text from a UIMessage (parts[]) or legacy {content} format.
 */
function extractText(message: Record<string, unknown>): string {
  const parts = message.parts as Array<{ type: string; text?: string }> | undefined;
  if (parts && parts.length > 0) {
    return parts
      .filter((p) => p.type === 'text' && p.text)
      .map((p) => p.text!)
      .join('');
  }
  return (message.content as string) ?? '';
}

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
    const lastMessage = messages[messages.length - 1] as Record<string, unknown> | undefined;
    if (redis && lastMessage?.role === 'user') {
      const lastText = extractText(lastMessage);
      if (lastText) {
        const cacheKey = getCacheKey(guestId, lastText);
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
    }

    const promptInput = {
      title: title as string,
      statement: statement as string,
      pattern: pattern as string,
      difficulty: difficulty as string,
      currentCode: currentCode as string | undefined,
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
