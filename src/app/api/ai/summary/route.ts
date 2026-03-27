import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildSummaryPrompt } from '@/lib/ai/prompts/summary';
import { handleApiError } from '@/lib/errors/api';
import { isSessionMode } from '@/lib/sophia';

export async function POST(req: Request): Promise<Response> {
  try {
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
