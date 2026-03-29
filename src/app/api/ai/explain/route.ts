import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildExplanationPrompt } from '@/lib/ai/prompts/explanation';
import { handleApiError } from '@/lib/errors/api';
import { withRateLimit } from '@/lib/ratelimit';
import { type NextRequest } from 'next/server';

async function handler(req: NextRequest): Promise<Response> {
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return new Response('AI features temporarily unavailable', { status: 503 });
    }

    const body = await req.json();
    const { title, statement, pattern, difficulty } = body;

    if (!title || !statement || !pattern || !difficulty) {
      return new Response('Missing required fields', { status: 400 });
    }

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

    return result.toUIMessageStreamResponse();
  } catch (error) {
    return handleApiError(new Response('', { status: 500 }), error, 'POST /api/ai/explain');
  }
}

export const POST = withRateLimit(handler);
