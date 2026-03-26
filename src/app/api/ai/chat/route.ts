import { streamText, convertToModelMessages } from 'ai';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { buildCoachPrompt } from '@/lib/ai/prompts/coach';
import { buildInterviewerPrompt } from '@/lib/ai/prompts/interviewer';

export async function POST(req: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return new Response('AI features temporarily unavailable', { status: 503 });
  }

  try {
    const body = await req.json();
    const { messages, mode, title, statement, pattern, difficulty } = body;

    if (!messages || !mode || !title || !statement || !pattern || !difficulty) {
      return new Response('Missing required fields', { status: 400 });
    }

    if (mode !== 'coach' && mode !== 'interviewer') {
      return new Response('Invalid mode. Must be "coach" or "interviewer".', { status: 400 });
    }

    const promptInput = { title, statement, pattern, difficulty };
    const { system } =
      mode === 'coach' ? buildCoachPrompt(promptInput) : buildInterviewerPrompt(promptInput);

    const result = streamText({
      model: openrouter(MODELS.reasoning),
      system,
      messages: await convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    console.error('Chat route error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
