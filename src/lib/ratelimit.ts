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

export async function rateLimit(
  ip: string,
): Promise<{ success: boolean; remaining: number; reset: number }> {
  const { success, remaining, reset } = await ratelimit.limit(ip);
  return { success, remaining, reset };
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
