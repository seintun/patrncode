import { render, screen } from '@testing-library/react';
import { PatternHeatmap } from '../PatternHeatmap';
import type { Pattern } from '@/generated/prisma/enums';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}));

interface PatternStat {
  pattern: Pattern;
  total: number;
  mastered: number;
  inProgress: number;
  needsRefresh: number;
  unseen: number;
}

const mockStats: PatternStat[] = [
  {
    pattern: 'ARRAYS_STRINGS',
    total: 5,
    mastered: 3,
    inProgress: 1,
    needsRefresh: 1,
    unseen: 0,
  },
  {
    pattern: 'HASH_MAPS',
    total: 3,
    mastered: 3,
    inProgress: 0,
    needsRefresh: 0,
    unseen: 0,
  },
  {
    pattern: 'TREES',
    total: 0,
    mastered: 0,
    inProgress: 0,
    needsRefresh: 0,
    unseen: 1,
  },
];

describe('PatternHeatmap', () => {
  it('renders grid of all 14 patterns', () => {
    render(<PatternHeatmap stats={[]} />);

    expect(screen.getByText('Arrays & Strings')).toBeInTheDocument();
    expect(screen.getByText('Hash Maps')).toBeInTheDocument();
    expect(screen.getByText('Two Pointers')).toBeInTheDocument();
    expect(screen.getByText('Sliding Window')).toBeInTheDocument();
    expect(screen.getByText('Binary Search')).toBeInTheDocument();
    expect(screen.getByText('Linked Lists')).toBeInTheDocument();
    expect(screen.getByText('Stacks & Queues')).toBeInTheDocument();
    expect(screen.getByText('Trees')).toBeInTheDocument();
    expect(screen.getByText('Graphs')).toBeInTheDocument();
    expect(screen.getByText('Recursion & Backtracking')).toBeInTheDocument();
    expect(screen.getByText('Dynamic Programming')).toBeInTheDocument();
    expect(screen.getByText('Heaps')).toBeInTheDocument();
    expect(screen.getByText('Sorting')).toBeInTheDocument();
    expect(screen.getByText('Greedy')).toBeInTheDocument();
  });

  it('shows mastered/total count for provided stats', () => {
    render(<PatternHeatmap stats={mockStats} />);

    // Arrays & Strings: 3/5
    expect(screen.getByText('3/5')).toBeInTheDocument();
    // Hash Maps: 3/3
    expect(screen.getByText('3/3')).toBeInTheDocument();
  });

  it('shows "-" for patterns with total=0', () => {
    render(<PatternHeatmap stats={mockStats} />);

    // TREES has total=0
    const dashes = screen.getAllByText('-');
    // TREES is one; other missing patterns also show '-'
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });

  it('shows dominant state label for each tile', () => {
    render(<PatternHeatmap stats={mockStats} />);

    // ARRAYS_STRINGS: needsRefresh > 0 → NEEDS_REFRESH
    expect(screen.getByText('NEEDS REFRESH')).toBeInTheDocument();
    // HASH_MAPS: mastered === total → MASTERED
    expect(screen.getByText('MASTERED')).toBeInTheDocument();
    // TREES: total === 0 → UNSEEN
    expect(screen.getAllByText('UNSEEN').length).toBeGreaterThanOrEqual(1);
  });

  it('all patterns render as UNSEEN when stats is empty', () => {
    render(<PatternHeatmap stats={[]} />);

    const unseenLabels = screen.getAllByText('UNSEEN');
    expect(unseenLabels).toHaveLength(14);
  });

  it('MIXED pattern state', () => {
    // ARRAYS_STRINGS has mastered=3, inProgress=1, needsRefresh=1 → needsRefresh>0 → NEEDS_REFRESH
    // Test with a stat where needsRefresh=0 but not all mastered → IN_PROGRESS
    const mixedStats: PatternStat[] = [
      {
        pattern: 'ARRAYS_STRINGS',
        total: 5,
        mastered: 3,
        inProgress: 1,
        needsRefresh: 0,
        unseen: 1,
      },
    ];

    render(<PatternHeatmap stats={mixedStats} />);

    expect(screen.getByText('IN PROGRESS')).toBeInTheDocument();
    expect(screen.getByText('3/5')).toBeInTheDocument();
  });
});
