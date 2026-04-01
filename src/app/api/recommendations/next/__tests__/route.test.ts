/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';
import { prisma } from '@/lib/db/prisma';
import { getCachedRecommendation, setCachedRecommendation } from '@/lib/recommendation-cache';

vi.mock('@/lib/errors/api', () => ({
  withAuth:
    (handler: any) =>
    async (req: NextRequest): Promise<Response> =>
      handler(req, { guestId: 'guest-1' }),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    patternWeakness: { findMany: vi.fn() },
    userProblemState: { findMany: vi.fn(), findFirst: vi.fn() },
    problem: { findFirst: vi.fn() },
  },
}));

vi.mock('@/lib/recommendation-cache', () => ({
  getCachedRecommendation: vi.fn(),
  setCachedRecommendation: vi.fn(),
}));

describe('GET /api/recommendations/next', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns cached recommendation when available', async () => {
    vi.mocked(getCachedRecommendation).mockResolvedValue({
      problemId: 'p1',
      slug: 'two-sum',
      title: 'Two Sum',
      pattern: 'HASH_MAPS',
      difficulty: 'EASY',
      reason: 'cached',
    });

    const response = await GET(new NextRequest('http://localhost/api/recommendations/next'));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.problemId).toBe('p1');
    expect(setCachedRecommendation).not.toHaveBeenCalled();
  });

  it('computes weak-pattern recommendation when cache is empty', async () => {
    vi.mocked(getCachedRecommendation).mockResolvedValue(null);
    vi.mocked(prisma.patternWeakness.findMany).mockResolvedValue([
      { pattern: 'SLIDING_WINDOW', confidenceScore: 0.2 },
    ] as any);
    vi.mocked(prisma.userProblemState.findMany).mockResolvedValue([] as any);
    vi.mocked(prisma.problem.findFirst).mockResolvedValue({
      id: 'p2',
      slug: 'longest-substring',
      title: 'Longest Substring',
      pattern: 'SLIDING_WINDOW',
      difficulty: 'MEDIUM',
    } as any);

    const response = await GET(new NextRequest('http://localhost/api/recommendations/next'));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.problemId).toBe('p2');
    expect(data.reason).toMatch(/SLIDING WINDOW/i);
    expect(setCachedRecommendation).toHaveBeenCalled();
  });
});
