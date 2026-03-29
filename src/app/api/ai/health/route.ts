import { NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/ratelimit';

async function handler() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    console.error('[AI Health] Missing or invalid OPENROUTER_API_KEY in environment');
    return NextResponse.json(
      {
        status: 'unavailable',
        error: 'AI_CONFIG_MISSING',
        message: 'AI configuration is missing or incomplete on the server.',
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}

export const GET = withRateLimit(handler);
