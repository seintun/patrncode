import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { type NextRequest } from 'next/server';

const redis = Redis.fromEnv();

export const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '1 m'),
  analytics: true,
  prefix: 'sophocode_ratelimit',
});

/**
 * Higher-order function to apply rate limiting to a route handler.
 */
export function withRateLimit(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const ip = getIP(req) || `fallback_ratelimit_${crypto.randomUUID()}`;
    const { success, remaining, reset } = await ratelimit.limit(ip);

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

    return handler(req);
  };
}

export function getIP(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }
  // @ts-expect-error ip might not be in the type but exists at runtime on Vercel
  return req.ip ?? null;
}
