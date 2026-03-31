import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildHintPrompt } from '@/lib/ai/prompts/hint';
import { handleApiError } from '@/lib/errors/api';
import { isSessionMode } from '@/lib/sophia';
import { withRateLimit } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';
import { hintRequestSchema, validateBody } from '@/lib/validations';

const VALID_LEVELS = [1, 2, 3] as const;

async function handler(req: NextRequest): Promise<Response> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('AI features temporarily unavailable', { status: 503 });
    }

    const body = await req.json();
    const validation = validateBody(hintRequestSchema, body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const { title, statement, pattern, currentCode, testResults, level, mode } = validation.data;

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

export const POST = withRateLimit(handler);
