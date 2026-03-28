import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
    return NextResponse.json(
      { status: 'unavailable', message: 'AI configuration missing' },
      { status: 503 },
    );
  }

  // Optional: Add a very lightweight provider check here if needed,
  // but avoid LLM token generation.

  return NextResponse.json({ status: 'ok' });
}
