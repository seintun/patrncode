import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildHintPrompt } from '@/lib/ai/prompts/hint';
import { handleApiError } from '@/lib/errors/api';
import { isSessionMode } from '@/lib/sophia';
import { rateLimit, getIP } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';

const VALID_LEVELS = [1, 2, 3] as const;

export async function POST(req: NextRequest): Promise<Response> {
  try {
    const ip = getIP(req) || `fallback_ratelimit_${crypto.randomUUID()}`;
    const { success, remaining, reset } = await rateLimit(ip);

    if (!success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '20',
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      });
    }

    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('AI features temporarily unavailable', { status: 503 });
    }

    const body = await req.json();
    const { title, statement, pattern, currentCode, testResults, level, mode } = body;

    if (!title || !statement || !pattern || level === undefined) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (!VALID_LEVELS.includes(level)) {
      return new Response('Invalid hint level. Must be 1, 2, or 3.', { status: 400 });
    }

    const { system, user } = buildHintPrompt({
      title,
      statement,
      pattern,
      currentCode: currentCode || '',
      testResults,
      level,
      mode: isSessionMode(mode) ? mode : undefined,
    });

    const result = streamText({
      model: openrouter(MODELS.reasoning),
      system,
      prompt: user,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'POST /api/ai/hint');
  }
}
