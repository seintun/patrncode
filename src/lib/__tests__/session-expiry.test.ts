/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanupExpiredSessions } from '../session/expiry';
import { prisma } from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    session: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    userProblemState: {
      updateMany: vi.fn(),
    },
  },
}));

describe('cleanupExpiredSessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns early when there are no expired sessions', async () => {
    vi.mocked(prisma.session.findMany).mockResolvedValueOnce([] as any);

    const result = await cleanupExpiredSessions('guest-1');

    expect(result).toEqual({ expiredCount: 0, abandonedCount: 0, resetMasteryCount: 0 });
    expect(prisma.session.updateMany).not.toHaveBeenCalled();
    expect(prisma.userProblemState.updateMany).not.toHaveBeenCalled();
  });

  it('marks expired sessions abandoned and resets IN_PROGRESS mastery without completed sessions', async () => {
    vi.mocked(prisma.session.findMany)
      .mockResolvedValueOnce([
        { id: 's1', problemId: 'p1' },
        { id: 's2', problemId: 'p2' },
      ] as any)
      .mockResolvedValueOnce([{ problemId: 'p2' }] as any);

    vi.mocked(prisma.session.updateMany).mockResolvedValueOnce({ count: 2 } as any);
    vi.mocked(prisma.userProblemState.updateMany).mockResolvedValueOnce({ count: 1 } as any);

    const result = await cleanupExpiredSessions('guest-1');

    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: {
        guestId: 'guest-1',
        status: 'IN_PROGRESS',
        expiresAt: { lt: expect.any(Date) },
        id: { in: ['s1', 's2'] },
      },
      data: { status: 'ABANDONED' },
    });
    expect(prisma.userProblemState.updateMany).toHaveBeenCalledWith({
      where: {
        guestId: 'guest-1',
        problemId: { in: ['p1'] },
        mastery: 'IN_PROGRESS',
      },
      data: { mastery: 'UNSEEN' },
    });

    expect(result).toEqual({ expiredCount: 2, abandonedCount: 2, resetMasteryCount: 1 });
  });
});
