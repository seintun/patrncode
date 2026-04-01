import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock next/headers (required by @/lib/errors/api)
vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

// Mock Prisma
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    problem: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import { prisma } from '@/lib/db/prisma';

// Import handlers after mocks are registered
import { GET, POST } from '../daily-challenge/route';

const mockProblemFindFirst = prisma.problem.findFirst as ReturnType<typeof vi.fn>;
const mockProblemUpdateMany = prisma.problem.updateMany as ReturnType<typeof vi.fn>;
const mockProblemFindMany = prisma.problem.findMany as ReturnType<typeof vi.fn>;
const mockProblemUpdate = prisma.problem.update as ReturnType<typeof vi.fn>;

describe('GET /api/admin/daily-challenge', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns { dailyChallenge: null } when no problem has dailyChallengeDate set', async () => {
    mockProblemFindFirst.mockResolvedValue(null);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ dailyChallenge: null });
  });

  it('returns problem data when daily challenge is set', async () => {
    const problem = {
      id: 'p1',
      title: 'Two Sum',
      slug: 'two-sum',
      difficulty: 'EASY',
      pattern: 'HASH_MAPS',
    };
    mockProblemFindFirst.mockResolvedValue(problem);
    const res = await GET();
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ dailyChallenge: problem });
  });
});

describe('POST /api/admin/daily-challenge', () => {
  const OLD_ENV = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...OLD_ENV, NODE_ENV: 'development' };
    // No ADMIN_SECRET set → auth passes in dev
    delete process.env.ADMIN_SECRET;
    mockProblemUpdateMany.mockResolvedValue({ count: 1 });
    mockProblemUpdate.mockResolvedValue({ id: 'p1', title: 'Two Sum' });
  });

  afterEach(() => {
    process.env = OLD_ENV;
  });

  it('returns 401 when ADMIN_SECRET is set and header is wrong', async () => {
    process.env.ADMIN_SECRET = 'super-secret';
    const req = new NextRequest('http://localhost/api/admin/daily-challenge', {
      method: 'POST',
      headers: { 'x-admin-secret': 'wrong' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 with no_candidates when no curated problems exist', async () => {
    mockProblemFindMany.mockResolvedValue([]);
    const req = new NextRequest('http://localhost/api/admin/daily-challenge', {
      method: 'POST',
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(400);
    expect(data.error).toBe('no_candidates');
  });

  it('picks a curated problem and sets dailyChallengeDate without requiring guestId', async () => {
    const candidate = { id: 'p1', title: 'Two Sum' };
    mockProblemFindMany.mockResolvedValue([candidate]);
    const req = new NextRequest('http://localhost/api/admin/daily-challenge', {
      method: 'POST',
      // no guestId header or body
    });
    const res = await POST(req);
    const data = await res.json();
    expect(res.status).toBe(200);
    expect(data).toEqual({ problemId: 'p1', title: 'Two Sum' });
    expect(mockProblemUpdateMany).toHaveBeenCalledWith({
      where: { dailyChallengeDate: { not: null } },
      data: { dailyChallengeDate: null },
    });
    expect(mockProblemUpdate).toHaveBeenCalledWith({
      where: { id: 'p1' },
      data: { dailyChallengeDate: expect.any(Date) },
    });
  });
});
