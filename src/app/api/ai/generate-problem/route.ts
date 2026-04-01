import { type NextRequest, NextResponse } from 'next/server';
import { generateText } from 'ai';
import { z } from 'zod';
import { openrouter } from '@/lib/ai/provider';
import { MODELS } from '@/lib/ai/models';
import { prisma } from '@/lib/db/prisma';
import { withAuth, handleApiError } from '@/lib/errors/api';
import { checkTokenBudget, recordTokenUsage } from '@/lib/ai/token-counter';

const requestSchema = z.object({
  pattern: z.string().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']).optional(),
});

const responseSchema = z.object({
  title: z.string().min(3).max(120),
  statement: z.string().min(20),
  examples: z.array(
    z.object({
      input: z.string(),
      output: z.string(),
      explanation: z.string(),
    }),
  ),
  starterCode: z.string().min(10),
  testCases: z
    .array(
      z.object({
        input: z.string(),
        expected: z.string(),
        isHidden: z.boolean(),
      }),
    )
    .min(5)
    .max(8),
});

function extractJson(text: string): unknown {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) {
    throw new Error('Model did not return valid JSON');
  }
  return JSON.parse(text.slice(start, end + 1));
}

async function handler(req: NextRequest, { guestId }: { guestId: string }): Promise<Response> {
  let requestId: string | null = null;
  try {
    if (!process.env.OPENROUTER_API_KEY) {
      return NextResponse.json({ error: 'ai_unavailable' }, { status: 503 });
    }

    const body = await req.json();
    const parsedRequest = requestSchema.safeParse(body);
    if (!parsedRequest.success) {
      return NextResponse.json({ error: parsedRequest.error.message }, { status: 400 });
    }

    const { pattern, difficulty } = parsedRequest.data;

    const budget = await checkTokenBudget(guestId);
    if (!budget.allowed) {
      return NextResponse.json(
        {
          error: 'token_limit_exceeded',
          tokensUsed: budget.tokensUsed,
          tokenLimit: budget.tokenLimit,
        },
        { status: 429 },
      );
    }

    const request = await prisma.customProblemRequest.create({
      data: {
        guestId,
        pattern: pattern as any,
        difficulty,
        status: 'PENDING',
      },
      select: { id: true },
    });
    requestId = request.id;

    const prompt = `You are an expert coding interview problem designer. Generate a unique coding problem.

Requirements:
- Pattern: ${pattern}
- Difficulty: ${difficulty ?? 'MEDIUM'}
- Statement: Clear problem description in markdown. Include edge cases.
- Examples: 2-3 examples with input, output, and explanation.
- Starter code: JavaScript function with signature.
- Test cases: 5-8 test cases (3 visible, rest hidden). Format: { input: string, expected: string, isHidden: boolean }

Return valid JSON only:
{
  "title": "string (3-8 words, no brand names)",
  "statement": "string (markdown)",
  "examples": [{ "input": "string", "output": "string", "explanation": "string" }],
  "starterCode": "string (JavaScript)",
  "testCases": [{ "input": "string", "expected": "string", "isHidden": boolean }]
}`;

    const result = await generateText({
      model: openrouter(MODELS.reasoning),
      prompt,
    });

    const parsedResponse = responseSchema.parse(extractJson(result.text));

    await prisma.customProblemRequest.update({
      where: { id: request.id },
      data: {
        status: 'FULFILLED',
        title: parsedResponse.title,
        statement: parsedResponse.statement,
        starterCode: parsedResponse.starterCode,
        testCases: parsedResponse.testCases,
      },
    });

    recordTokenUsage(guestId, 3_000).catch(() => {
      // best effort usage accounting
    });

    return NextResponse.json({ requestId: request.id, ...parsedResponse });
  } catch (error) {
    if (requestId) {
      await prisma.customProblemRequest
        .update({
          where: { id: requestId },
          data: {
            status: 'FAILED',
            errorMessage: error instanceof Error ? error.message : 'unknown',
          },
        })
        .catch(() => {
          // no-op
        });
    }
    return handleApiError(
      new Response('', { status: 500 }),
      error,
      'POST /api/ai/generate-problem',
    );
  }
}

export const POST = withAuth(handler);
