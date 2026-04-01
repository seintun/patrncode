import { Redis } from '@upstash/redis';

const RECOMMENDATION_TTL_SECONDS = 60 * 60;

let redis: Redis | null = null;

try {
  redis = Redis.fromEnv();
} catch {
  redis = null;
}

export interface CachedRecommendation {
  problemId: string | null;
  slug: string | null;
  title: string | null;
  pattern: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  reason: string;
}

function key(guestId: string): string {
  return `recommendation:${guestId}`;
}

export async function getCachedRecommendation(
  guestId: string,
): Promise<CachedRecommendation | null> {
  if (!redis) return null;
  try {
    return await redis.get<CachedRecommendation>(key(guestId));
  } catch {
    return null;
  }
}

export async function setCachedRecommendation(
  guestId: string,
  value: CachedRecommendation,
): Promise<void> {
  if (!redis) return;
  try {
    await redis.set(key(guestId), value, { ex: RECOMMENDATION_TTL_SECONDS });
  } catch {
    // best-effort cache write
  }
}

export async function invalidateRecommendation(guestId: string): Promise<void> {
  if (!redis) return;
  try {
    await redis.del(key(guestId));
  } catch {
    // best-effort cache invalidation
  }
}
