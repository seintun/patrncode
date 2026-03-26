export type MasteryState = 'UNSEEN' | 'IN_PROGRESS' | 'MASTERED' | 'NEEDS_REFRESH';

export interface MasteryInput {
  currentState: MasteryState;
  solved: boolean;
  hintsUsed: number;
  lastSolvedAt?: Date | null;
}

const REFRESH_THRESHOLD_DAYS = 7;

export function computeNextMastery(input: MasteryInput): MasteryState {
  const { currentState, solved, hintsUsed, lastSolvedAt } = input;

  // Check if MASTERED problems need refresh (7+ days since last solve)
  if (
    currentState === 'MASTERED' &&
    lastSolvedAt &&
    daysSince(lastSolvedAt) >= REFRESH_THRESHOLD_DAYS
  ) {
    return 'NEEDS_REFRESH';
  }

  // UNSEEN always goes to IN_PROGRESS on any attempt
  if (currentState === 'UNSEEN') {
    return 'IN_PROGRESS';
  }

  // Solved with ≤1 hints → MASTERED
  if (solved && hintsUsed <= 1) {
    return 'MASTERED';
  }

  // Not solved OR solved with >1 hints → IN_PROGRESS
  return 'IN_PROGRESS';
}

const REVIEW_INTERVALS: Record<MasteryState, number> = {
  MASTERED: 7,
  NEEDS_REFRESH: 3,
  IN_PROGRESS: 1,
  UNSEEN: 1,
};

export function computeNextReviewDate(mastery: MasteryState, fromDate: Date = new Date()): Date {
  const days = REVIEW_INTERVALS[mastery];
  const next = new Date(fromDate);
  next.setDate(next.getDate() + days);
  return next;
}

function daysSince(date: Date): number {
  const now = Date.now();
  const then = date.getTime();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}
