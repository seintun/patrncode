import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildSummaryPrompt } from '@/lib/ai/prompts/summary';
import { handleApiError } from '@/lib/errors/api';
import { isSessionMode } from '@/lib/sophia';
import { withRateLimit } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';
import { summaryRequestSchema, validateBody } from '@/lib/validations';
import { sanitizeCoachingContent } from '@/lib/ai/safety';
import { createSingleTextSseResponse } from '@/lib/ai/sse';

async function handler(req: NextRequest): Promise<Response> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('AI features temporarily unavailable', { status: 503 });
    }

    const body = await req.json();
    const validation = validateBody(summaryRequestSchema, body);
    if (!validation.success) {
      return new Response(JSON.stringify({ error: validation.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    const { title, pattern, finalCode, testResults, hintsUsed, timeSpentSeconds, mode } =
      validation.data;

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

    const rawText = await result.text;
    const safeMode = isSessionMode(mode) ? mode : undefined;
    const safeText = sanitizeCoachingContent(rawText, { mode: safeMode });

    return createSingleTextSseResponse(safeText);
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'POST /api/ai/summary');
  }
}

export const POST = withRateLimit(handler);
