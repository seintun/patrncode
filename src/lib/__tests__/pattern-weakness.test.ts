/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePatternWeakness } from '../pattern-weakness';
import { prisma } from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    patternWeakness: {
      upsert: vi.fn(),
      update: vi.fn(),
    },
  },
}));

describe('updatePatternWeakness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increments failed count for attempted outcomes', async () => {
    vi.mocked(prisma.patternWeakness.upsert).mockResolvedValue({
      id: 'pw1',
      failedCount: 3,
      successCount: 1,
    } as any);
    vi.mocked(prisma.patternWeakness.update).mockResolvedValue({} as any);

    await updatePatternWeakness({
      guestId: 'guest-1',
      pattern: 'SLIDING_WINDOW',
      outcome: 'ATTEMPTED',
    });

    expect(prisma.patternWeakness.upsert).toHaveBeenCalled();
    expect(prisma.patternWeakness.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ confidenceScore: 0.25 }),
      }),
    );
  });

  it('increments success count for solved with zero hints', async () => {
    vi.mocked(prisma.patternWeakness.upsert).mockResolvedValue({
      id: 'pw2',
      failedCount: 1,
      successCount: 3,
    } as any);
    vi.mocked(prisma.patternWeakness.update).mockResolvedValue({} as any);

    await updatePatternWeakness({
      guestId: 'guest-1',
      pattern: 'HASH_MAPS',
      outcome: 'SOLVED_ZERO_HINTS',
    });

    expect(prisma.patternWeakness.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ confidenceScore: 0.75 }),
      }),
    );
  });
});
