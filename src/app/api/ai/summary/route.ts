import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildSummaryPrompt } from '@/lib/ai/prompts/summary';
import { handleApiError } from '@/lib/errors/api';
import { isSessionMode } from '@/lib/sophia';
import { rateLimit, getIP } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';

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
    const { title, pattern, finalCode, testResults, hintsUsed, timeSpentSeconds, mode } = body;

    if (
      !title ||
      !pattern ||
      finalCode === undefined ||
      !testResults ||
      hintsUsed === undefined ||
      timeSpentSeconds === undefined
    ) {
      return new Response('Missing required fields', { status: 400 });
    }

    const { system, user } = buildSummaryPrompt({
      title,
      pattern,
      finalCode,
      testResults,
      hintsUsed,
      timeSpentSeconds,
      mode: isSessionMode(mode) ? mode : undefined,
    });

    const result = streamText({
      model: openrouter(MODELS.summary),
      system,
      prompt: user,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'POST /api/ai/summary');
  }
}
