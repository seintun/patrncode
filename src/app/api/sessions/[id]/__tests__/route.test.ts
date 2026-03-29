/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';
import { requireOwnership } from '@/lib/auth/session-auth';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    session: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/auth/session-auth', () => ({
  requireOwnership: vi.fn(),
}));

describe('GET /api/sessions/[id]', () => {
  const mockGuestId = 'test-guest-id';
  const mockSessionId = 'clxp1234567890abcdefghijkl';

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock cookies return value
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: mockGuestId }),
    } as any);

    vi.mocked(requireOwnership).mockResolvedValue({} as any);
  });

  it('returns session with testCases when ownership is valid', async () => {
    const mockSession = {
      id: mockSessionId,
      guestId: mockGuestId,
      problem: {
        id: 'prob-1',
        title: 'Two Sum',
        testCases: [{ id: 'tc-1', input: '[2,7,11,15]', expected: '[0,1]', isHidden: false }],
      },
      runs: [],
      hints: [],
    };

    // @ts-expect-error - mock nested include/select structure
    vi.mocked(prisma.session.findUnique).mockResolvedValue(mockSession);

    const req = new NextRequest(`http://localhost/api/sessions/${mockSessionId}`);
    const params = Promise.resolve({ id: mockSessionId });

    // The handler is wrapped with withAuthAndId
    const response = await GET(req, { params } as any);

    expect(response.status).toBe(200);
    const data = await response.json();

    // Regression test for the fixed bug
    expect(data.problem).toBeDefined();
    expect(data.problem.testCases).toBeDefined();
    expect(Array.isArray(data.problem.testCases)).toBe(true);
    expect(data.problem.testCases[0].input).toBe('[2,7,11,15]');
  });

  it('verifies PATCH returns session', async () => {
    const mockUpdatedSession = { id: mockSessionId, code: 'print(1)' };
    vi.mocked(prisma.session.update).mockResolvedValue(mockUpdatedSession as any);

    const req = new NextRequest(`http://localhost/api/sessions/${mockSessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ code: 'print(1)' }),
    });
    const params = Promise.resolve({ id: mockSessionId });

    // Note: PATCH is also exported from route.ts
    const { PATCH } = await import('../route');
    const response = await PATCH(req, { params } as any);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.id).toBe(mockSessionId);
  });

  it('returns 401 if guest cookie is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const req = new NextRequest(`http://localhost/api/sessions/${mockSessionId}`);
    const params = Promise.resolve({ id: mockSessionId });

    const response = await GET(req, { params } as any);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toContain('Unauthorized');
  });
});
