import { Ratelimit, type Duration } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { type NextRequest } from 'next/server';
import { RATE_LIMITS } from '@/lib/config';

let redis: Redis | null = null;

try {
  redis = Redis.fromEnv();
} catch {
  console.warn('[ratelimit] Upstash Redis not configured. Rate limiting disabled.');
}

// ── In-memory fallback ──────────────────────────────────────────────────────

interface MemoryEntry {
  count: number;
  resetAt: number;
}

const memoryStore = new Map<string, MemoryEntry>();

// Cleanup expired entries every 5 minutes
const cleanupInterval = setInterval(
  () => {
    const now = Date.now();
    for (const [key, entry] of memoryStore) {
      if (entry.resetAt <= now) {
        memoryStore.delete(key);
      }
    }
  },
  5 * 60 * 1000,
);
// Allow Node to exit even if the timer is pending (prevents serverless warmup issues)
cleanupInterval.unref();

function memoryLimit(
  identifier: string,
  maxRequests: number,
  windowMs: number,
): { success: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const entry = memoryStore.get(identifier);

  if (!entry || entry.resetAt <= now) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs });
    return { success: true, remaining: maxRequests - 1, reset: now + windowMs };
  }

  entry.count++;
  const success = entry.count <= maxRequests;
  return {
    success,
    remaining: Math.max(0, maxRequests - entry.count),
    reset: entry.resetAt,
  };
}

// ── Rate limiter instances ──────────────────────────────────────────────────

function createRatelimit(requests: number, window: Duration) {
  if (!redis) return null;
  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix: 'sophocode_ratelimit',
  });
}

const guestPageLimiter = createRatelimit(
  RATE_LIMITS.GUEST_PAGE.requests,
  RATE_LIMITS.GUEST_PAGE.window,
);

const apiLimiter = createRatelimit(RATE_LIMITS.API.requests, RATE_LIMITS.API.window);

const authLimiter = createRatelimit(RATE_LIMITS.AUTH.requests, RATE_LIMITS.AUTH.window);

// ── Helpers ─────────────────────────────────────────────────────────────────

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

function windowToMs(window: string): number {
  const match = window.match(/^(\d+)\s*m$/);
  if (match) return parseInt(match[1], 10) * 60 * 1000;
  return 60_000; // default 1 minute
}

// ── Rate limit check ────────────────────────────────────────────────────────

interface RateLimitResult {
  success: boolean;
  remaining: number;
  reset: number;
}

async function checkRateLimit(
  limiter: Ratelimit | null,
  identifier: string,
  maxRequests: number,
  window: string,
): Promise<RateLimitResult> {
  if (limiter) {
    const result = await limiter.limit(identifier);
    return { success: result.success, remaining: result.remaining, reset: result.reset };
  }
  // Fallback to in-memory
  return memoryLimit(identifier, maxRequests, windowToMs(window));
}

// ── Higher-order wrappers ───────────────────────────────────────────────────

/**
 * Rate limit for API routes (200 req/min per guestId or IP).
 */
export function withRateLimit(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const guestId = req.headers.get('x-guest-id');
    const identifier = guestId || getIP(req) || `fallback_${crypto.randomUUID()}`;

    const { success, remaining, reset } = await checkRateLimit(
      apiLimiter,
      identifier,
      RATE_LIMITS.API.requests,
      RATE_LIMITS.API.window,
    );

    if (!success) {
      return new Response(JSON.stringify({ error: 'Too Many Requests', retryAfter: reset }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': String(RATE_LIMITS.API.requests),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      });
    }

    return handler(req);
  };
}

/**
 * Rate limit for guest page routes (100 req/min per IP).
 */
export function withGuestRateLimit(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const ip = getIP(req) || `fallback_${crypto.randomUUID()}`;

    const { success, remaining, reset } = await checkRateLimit(
      guestPageLimiter,
      ip,
      RATE_LIMITS.GUEST_PAGE.requests,
      RATE_LIMITS.GUEST_PAGE.window,
    );

    if (!success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMITS.GUEST_PAGE.requests),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      });
    }

    return handler(req);
  };
}

/**
 * Rate limit for auth routes (10 req/min per IP — brute force protection).
 */
export function withAuthRateLimit(handler: (req: NextRequest) => Promise<Response>) {
  return async (req: NextRequest): Promise<Response> => {
    const ip = getIP(req) || `fallback_${crypto.randomUUID()}`;

    const { success, remaining, reset } = await checkRateLimit(
      authLimiter,
      ip,
      RATE_LIMITS.AUTH.requests,
      RATE_LIMITS.AUTH.window,
    );

    if (!success) {
      return new Response('Too Many Requests', {
        status: 429,
        headers: {
          'X-RateLimit-Limit': String(RATE_LIMITS.AUTH.requests),
          'X-RateLimit-Remaining': String(remaining),
          'X-RateLimit-Reset': String(reset),
        },
      });
    }

    return handler(req);
  };
}
