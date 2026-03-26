import { describe, it, expect } from 'vitest';
import {
  computeNextMastery,
  computeNextReviewDate,
  type MasteryState,
  type MasteryInput,
} from '../mastery';

describe('computeNextMastery', () => {
  describe('UNSEEN state', () => {
    it('transitions to IN_PROGRESS on first attempt', () => {
      const input: MasteryInput = {
        currentState: 'UNSEEN',
        solved: false,
        hintsUsed: 0,
      };
      expect(computeNextMastery(input)).toBe('IN_PROGRESS');
    });

    it('transitions to IN_PROGRESS even if solved on first attempt', () => {
      const input: MasteryInput = {
        currentState: 'UNSEEN',
        solved: true,
        hintsUsed: 0,
      };
      expect(computeNextMastery(input)).toBe('IN_PROGRESS');
    });
  });

  describe('IN_PROGRESS state', () => {
    it('transitions to MASTERED when solved with 0 hints', () => {
      const input: MasteryInput = {
        currentState: 'IN_PROGRESS',
        solved: true,
        hintsUsed: 0,
      };
      expect(computeNextMastery(input)).toBe('MASTERED');
    });

    it('transitions to MASTERED when solved with 1 hint', () => {
      const input: MasteryInput = {
        currentState: 'IN_PROGRESS',
        solved: true,
        hintsUsed: 1,
      };
      expect(computeNextMastery(input)).toBe('MASTERED');
    });

    it('stays IN_PROGRESS when solved with >1 hints', () => {
      const input: MasteryInput = {
        currentState: 'IN_PROGRESS',
        solved: true,
        hintsUsed: 2,
      };
      expect(computeNextMastery(input)).toBe('IN_PROGRESS');
    });

    it('stays IN_PROGRESS when solved with 3 hints', () => {
      const input: MasteryInput = {
        currentState: 'IN_PROGRESS',
        solved: true,
        hintsUsed: 3,
      };
      expect(computeNextMastery(input)).toBe('IN_PROGRESS');
    });

    it('stays IN_PROGRESS when not solved', () => {
      const input: MasteryInput = {
        currentState: 'IN_PROGRESS',
        solved: false,
        hintsUsed: 0,
      };
      expect(computeNextMastery(input)).toBe('IN_PROGRESS');
    });

    it('stays IN_PROGRESS when not solved even with hints', () => {
      const input: MasteryInput = {
        currentState: 'IN_PROGRESS',
        solved: false,
        hintsUsed: 2,
      };
      expect(computeNextMastery(input)).toBe('IN_PROGRESS');
    });
  });

  describe('MASTERED state', () => {
    it('stays MASTERED if solved recently (less than 7 days)', () => {
      const sixDaysAgo = new Date();
      sixDaysAgo.setDate(sixDaysAgo.getDate() - 6);

      const input: MasteryInput = {
        currentState: 'MASTERED',
        solved: true,
        hintsUsed: 0,
        lastSolvedAt: sixDaysAgo,
      };
      expect(computeNextMastery(input)).toBe('MASTERED');
    });

    it('transitions to NEEDS_REFRESH if 7+ days since last solve', () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const input: MasteryInput = {
        currentState: 'MASTERED',
        solved: false,
        hintsUsed: 0,
        lastSolvedAt: sevenDaysAgo,
      };
      expect(computeNextMastery(input)).toBe('NEEDS_REFRESH');
    });

    it('transitions to NEEDS_REFRESH if 30 days since last solve', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const input: MasteryInput = {
        currentState: 'MASTERED',
        solved: false,
        hintsUsed: 0,
        lastSolvedAt: thirtyDaysAgo,
      };
      expect(computeNextMastery(input)).toBe('NEEDS_REFRESH');
    });

    it('stays MASTERED if lastSolvedAt is null', () => {
      const input: MasteryInput = {
        currentState: 'MASTERED',
        solved: true,
        hintsUsed: 0,
        lastSolvedAt: null,
      };
      expect(computeNextMastery(input)).toBe('MASTERED');
    });

    it('transitions to IN_PROGRESS if attempted but not solved', () => {
      const recentDate = new Date();

      const input: MasteryInput = {
        currentState: 'MASTERED',
        solved: false,
        hintsUsed: 0,
        lastSolvedAt: recentDate,
      };
      expect(computeNextMastery(input)).toBe('IN_PROGRESS');
    });
  });

  describe('NEEDS_REFRESH state', () => {
    it('transitions to MASTERED when re-solved', () => {
      const input: MasteryInput = {
        currentState: 'NEEDS_REFRESH',
        solved: true,
        hintsUsed: 0,
      };
      expect(computeNextMastery(input)).toBe('MASTERED');
    });

    it('transitions to MASTERED when re-solved with 1 hint', () => {
      const input: MasteryInput = {
        currentState: 'NEEDS_REFRESH',
        solved: true,
        hintsUsed: 1,
      };
      expect(computeNextMastery(input)).toBe('MASTERED');
    });

    it('stays IN_PROGRESS when re-solved with >1 hints', () => {
      const input: MasteryInput = {
        currentState: 'NEEDS_REFRESH',
        solved: true,
        hintsUsed: 2,
      };
      expect(computeNextMastery(input)).toBe('IN_PROGRESS');
    });

    it('transitions to IN_PROGRESS when not solved', () => {
      const input: MasteryInput = {
        currentState: 'NEEDS_REFRESH',
        solved: false,
        hintsUsed: 0,
      };
      expect(computeNextMastery(input)).toBe('IN_PROGRESS');
    });
  });
});

describe('computeNextReviewDate', () => {
  const baseDate = new Date('2026-03-25T12:00:00Z');

  it('returns 7 days after MASTERED', () => {
    const result = computeNextReviewDate('MASTERED', baseDate);
    const expected = new Date('2026-04-01T12:00:00Z');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('returns 3 days after NEEDS_REFRESH', () => {
    const result = computeNextReviewDate('NEEDS_REFRESH', baseDate);
    const expected = new Date('2026-03-28T12:00:00Z');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('returns 1 day after IN_PROGRESS', () => {
    const result = computeNextReviewDate('IN_PROGRESS', baseDate);
    const expected = new Date('2026-03-26T12:00:00Z');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('returns 1 day after UNSEEN', () => {
    const result = computeNextReviewDate('UNSEEN', baseDate);
    const expected = new Date('2026-03-26T12:00:00Z');
    expect(result.getTime()).toBe(expected.getTime());
  });

  it('uses current date when no fromDate provided', () => {
    const before = Date.now();
    const result = computeNextReviewDate('MASTERED');
    const after = Date.now();

    const expectedMin = before + 7 * 24 * 60 * 60 * 1000;
    const expectedMax = after + 7 * 24 * 60 * 60 * 1000;

    expect(result.getTime()).toBeGreaterThanOrEqual(expectedMin);
    expect(result.getTime()).toBeLessThanOrEqual(expectedMax);
  });
});
