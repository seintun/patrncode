import { NextResponse, type NextRequest } from 'next/server';
import { rateLimit, getIP } from '@/lib/ratelimit';

export async function GET(req: NextRequest) {
  const ip = getIP(req) || `fallback_ratelimit_${crypto.randomUUID()}`;
  const { success, remaining, reset } = await rateLimit(ip);

  if (!success) {
    return new Response('Too Many Requests', {
      status: 429,
      headers: {
        'X-RateLimit-Limit': '20',
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString(),
      },
    });
  }

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
