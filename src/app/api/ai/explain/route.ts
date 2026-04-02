import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildExplanationPrompt } from '@/lib/ai/prompts/explanation';
import { handleApiError } from '@/lib/errors/api';
import { withRateLimit } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';
import { explainRequestSchema, validateBody } from '@/lib/validations';
import { sanitizeCoachingContent } from '@/lib/ai/safety';
import { createSingleTextSseResponse } from '@/lib/ai/sse';

async function handler(req: NextRequest): Promise<Response> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('AI features temporarily unavailable', { status: 503 });
    }

    const body = await req.json();
    const validation = validateBody(explainRequestSchema, body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const { title, statement, pattern, difficulty } = validation.data;

    const { system, user } = buildExplanationPrompt({
      title,
      statement,
      pattern,
      difficulty,
    });

    const result = streamText({
      model: openrouter(MODELS.reasoning),
      system,
      prompt: user,
    });

    const rawText = await result.text;
    const safeText = sanitizeCoachingContent(rawText);

    return createSingleTextSseResponse(safeText);
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'POST /api/ai/explain');
  }
}

export const POST = withRateLimit(handler);
