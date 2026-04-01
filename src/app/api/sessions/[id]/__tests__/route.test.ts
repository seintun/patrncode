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
      findFirst: vi.fn(),
    },
    userProblemState: {
      updateMany: vi.fn(),
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

describe('PATCH /api/sessions/[id] - mastery reset on abandon', () => {
  const mockGuestId = 'test-guest-id';
  const mockSessionId = 'clxp1234567890abcdefghijkl';
  const mockProblemId = 'prob-123';

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: mockGuestId }),
    } as any);

    vi.mocked(requireOwnership).mockResolvedValue({} as any);
  });

  it('resets mastery to UNSEEN when session is abandoned and no completed session exists', async () => {
    const mockUpdatedSession = {
      id: mockSessionId,
      guestId: mockGuestId,
      problemId: mockProblemId,
      status: 'ABANDONED',
    };

    vi.mocked(prisma.session.update).mockResolvedValue(mockUpdatedSession as any);
    vi.mocked(prisma.session.findFirst).mockResolvedValue(null); // No completed session
    vi.mocked(prisma.userProblemState.updateMany).mockResolvedValue({ count: 1 });

    const { PATCH } = await import('../route');
    const req = new NextRequest(`http://localhost/api/sessions/${mockSessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ABANDONED' }),
    });
    const params = Promise.resolve({ id: mockSessionId });

    const response = await PATCH(req, { params } as any);

    expect(response.status).toBe(200);

    // Verify it checked for completed sessions
    expect(prisma.session.findFirst).toHaveBeenCalledWith({
      where: {
        guestId: mockGuestId,
        problemId: mockProblemId,
        status: 'COMPLETED',
      },
    });

    // Verify it reset mastery to UNSEEN
    expect(prisma.userProblemState.updateMany).toHaveBeenCalledWith({
      where: {
        guestId: mockGuestId,
        problemId: mockProblemId,
        mastery: 'IN_PROGRESS',
      },
      data: { mastery: 'UNSEEN' },
    });
  });

  it('does NOT reset mastery when session is abandoned but completed session exists', async () => {
    const mockUpdatedSession = {
      id: mockSessionId,
      guestId: mockGuestId,
      problemId: mockProblemId,
      status: 'ABANDONED',
    };

    vi.mocked(prisma.session.update).mockResolvedValue(mockUpdatedSession as any);
    vi.mocked(prisma.session.findFirst).mockResolvedValue({
      id: 'completed-session-id',
      status: 'COMPLETED',
    } as any);

    const { PATCH } = await import('../route');
    const req = new NextRequest(`http://localhost/api/sessions/${mockSessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'ABANDONED' }),
    });
    const params = Promise.resolve({ id: mockSessionId });

    const response = await PATCH(req, { params } as any);

    expect(response.status).toBe(200);

    // Verify it checked for completed sessions
    expect(prisma.session.findFirst).toHaveBeenCalled();

    // Verify it did NOT reset mastery
    expect(prisma.userProblemState.updateMany).not.toHaveBeenCalled();
  });

  it('does NOT reset mastery when status is not ABANDONED', async () => {
    const mockUpdatedSession = {
      id: mockSessionId,
      guestId: mockGuestId,
      problemId: mockProblemId,
      status: 'COMPLETED',
    };

    vi.mocked(prisma.session.update).mockResolvedValue(mockUpdatedSession as any);

    const { PATCH } = await import('../route');
    const req = new NextRequest(`http://localhost/api/sessions/${mockSessionId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const params = Promise.resolve({ id: mockSessionId });

    const response = await PATCH(req, { params } as any);

    expect(response.status).toBe(200);

    // Verify it did NOT check for completed sessions or reset mastery
    expect(prisma.session.findFirst).not.toHaveBeenCalled();
    expect(prisma.userProblemState.updateMany).not.toHaveBeenCalled();
  });
});
