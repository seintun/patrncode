import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildHintPrompt } from '@/lib/ai/prompts/hint';
import { handleApiError } from '@/lib/errors/api';
import { isSessionMode } from '@/lib/sophia';
import { withRateLimit } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';
import { hintRequestSchema, validateBody } from '@/lib/validations';
import { sanitizeCoachingContent } from '@/lib/ai/safety';
import { createSingleTextSseResponse } from '@/lib/ai/sse';

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

    // Zod already validates level is 1-3; cast to literal type for buildHintPrompt
    const hintLevel = level as 1 | 2 | 3;

    const { system, user } = buildHintPrompt({
      title,
      statement,
      pattern,
      currentCode: currentCode || '',
      testResults,
      level: hintLevel,
      mode: isSessionMode(mode) ? mode : undefined,
    });

    const result = streamText({
      model: openrouter(MODELS.reasoning),
      system,
      prompt: user,
    });

    const rawText = await result.text;
    const safeMode = isSessionMode(mode) ? mode : undefined;
    const safeText = sanitizeCoachingContent(rawText, { mode: safeMode });

    return createSingleTextSseResponse(safeText);
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'POST /api/ai/hint');
  }
}

export const POST = withRateLimit(handler);
