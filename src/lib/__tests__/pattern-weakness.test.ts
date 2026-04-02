/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updatePatternWeakness } from '../pattern-weakness';
import { prisma } from '@/lib/db/prisma';

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    $executeRaw: vi.fn(),
  },
}));

describe('updatePatternWeakness', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('increments failed count for attempted outcomes', async () => {
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1 as any);

    await updatePatternWeakness({
      guestId: 'guest-1',
      pattern: 'SLIDING_WINDOW',
      outcome: 'ATTEMPTED',
    });

    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
  });

  it('increments success count for solved with zero hints', async () => {
    vi.mocked(prisma.$executeRaw).mockResolvedValue(1 as any);

    await updatePatternWeakness({
      guestId: 'guest-1',
      pattern: 'HASH_MAPS',
      outcome: 'SOLVED_ZERO_HINTS',
    });

    expect(prisma.$executeRaw).toHaveBeenCalledOnce();
  });
});
