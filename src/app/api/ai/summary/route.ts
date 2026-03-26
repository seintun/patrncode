import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildSummaryPrompt } from '@/lib/ai/prompts/summary';

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('AI features temporarily unavailable', { status: 503 });
  }

  try {
    const body = await req.json();
    const { title, pattern, finalCode, testResults, hintsUsed, timeSpentSeconds } = body;

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
    });

    const result = streamText({
      model: openrouter(MODELS.summary),
      system,
      prompt: user,
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Summary route error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
