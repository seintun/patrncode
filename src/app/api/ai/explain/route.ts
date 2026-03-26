import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildExplanationPrompt } from '@/lib/ai/prompts/explanation';

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('AI features temporarily unavailable', { status: 503 });
  }

  try {
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
    console.error('Explain route error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
