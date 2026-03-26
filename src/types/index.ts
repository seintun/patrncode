// Core domain types used across the app

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Pattern =
  | 'ARRAYS_STRINGS'
  | 'HASH_MAPS'
  | 'TWO_POINTERS'
  | 'SLIDING_WINDOW'
  | 'BINARY_SEARCH'
  | 'LINKED_LISTS'
  | 'STACKS_QUEUES'
  | 'TREES'
  | 'GRAPHS'
  | 'RECURSION_BACKTRACKING'
  | 'DYNAMIC_PROGRAMMING'
  | 'HEAPS'
  | 'SORTING'
  | 'GREEDY';

export type MasteryState = 'UNSEEN' | 'IN_PROGRESS' | 'MASTERED' | 'NEEDS_REFRESH';
export type SessionMode = 'SELF_PRACTICE' | 'COACH_ME' | 'MOCK_INTERVIEW';
export type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
export type SessionOutcome = 'SOLVED' | 'PARTIALLY_SOLVED' | 'NOT_SOLVED';

export interface Problem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  pattern: Pattern;
  statement: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  starterCode: string;
  approaches?: Array<{ name: string; description: string; complexity: string }> | null;
}

export interface TestCase {
  id: string;
  input: string;
  expected: string;
  isHidden: boolean;
  order: number;
}

export interface Session {
  id: string;
  guestId: string;
  userId?: string | null;
  problemId: string;
  mode: SessionMode;
  status: SessionStatus;
  code?: string | null;
  startedAt: string;
  completedAt?: string | null;
  outcome?: SessionOutcome | null;
}

export interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

export interface RunResult {
  results: TestResult[];
  passed: number;
  total: number;
}
