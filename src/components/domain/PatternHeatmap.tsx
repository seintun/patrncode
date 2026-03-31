'use client';

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { Pattern } from '@/generated/prisma/enums';

interface PatternStat {
  pattern: Pattern;
  total: number;
  mastered: number;
  inProgress: number;
  needsRefresh: number;
  unseen: number;
}

interface PatternHeatmapProps {
  stats: PatternStat[];
}

const patternLabels: Record<string, string> = {
  ARRAYS_STRINGS: 'Arrays & Strings',
  HASH_MAPS: 'Hash Maps',
  TWO_POINTERS: 'Two Pointers',
  SLIDING_WINDOW: 'Sliding Window',
  BINARY_SEARCH: 'Binary Search',
  LINKED_LISTS: 'Linked Lists',
  STACKS_QUEUES: 'Stacks & Queues',
  TREES: 'Trees',
  GRAPHS: 'Graphs',
  RECURSION_BACKTRACKING: 'Recursion & Backtracking',
  DYNAMIC_PROGRAMMING: 'Dynamic Programming',
  HEAPS: 'Heaps',
  SORTING: 'Sorting',
  GREEDY: 'Greedy',
};

const stateColors: Record<string, string> = {
  UNSEEN: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]',
  IN_PROGRESS: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
  MASTERED: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  NEEDS_REFRESH: 'bg-[var(--color-error)]/20 text-[var(--color-error)]',
};

function getDominantState(stat: PatternStat): string {
  if (stat.total === 0) return 'UNSEEN';
  if (stat.needsRefresh > 0) return 'NEEDS_REFRESH';
  if (stat.mastered === stat.total) return 'MASTERED';
  if (stat.inProgress > 0 || stat.mastered > 0) return 'IN_PROGRESS';
  return 'UNSEEN';
}

export function PatternHeatmap({ stats }: PatternHeatmapProps) {
  const router = useRouter();

  const allPatterns: Pattern[] = [
    'ARRAYS_STRINGS',
    'HASH_MAPS',
    'TWO_POINTERS',
    'SLIDING_WINDOW',
    'BINARY_SEARCH',
    'LINKED_LISTS',
    'STACKS_QUEUES',
    'TREES',
    'GRAPHS',
    'RECURSION_BACKTRACKING',
    'DYNAMIC_PROGRAMMING',
    'HEAPS',
    'SORTING',
    'GREEDY',
  ];

  const statsMap = new Map(stats.map((s) => [s.pattern, s]));

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
      {allPatterns.map((pattern) => {
        const stat = statsMap.get(pattern) ?? {
          pattern,
          total: 0,
          mastered: 0,
          inProgress: 0,
          needsRefresh: 0,
          unseen: 0,
        };
        const dominant = getDominantState(stat);

        return (
          <button
            type="button"
            key={pattern}
            onClick={() => router.push(`/practice?pattern=${pattern}`)}
            aria-label={`${patternLabels[pattern] ?? pattern.replace(/_/g, ' ')}: ${stat.total > 0 ? `${stat.mastered} of ${stat.total} mastered` : 'Not started'}. Status: ${dominant.replace(/_/g, ' ')}`}
            title={`${stat.mastered} mastered, ${stat.inProgress} in progress, ${stat.needsRefresh} needs refresh, ${stat.unseen} unseen`}
            className={cn(
              'rounded-lg border border-[var(--color-border)] p-3 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)] hover:border-[var(--color-accent)]/50',
              stateColors[dominant],
            )}
            style={{
              animation: 'scaleIn 0.3s ease-out',
              animationDelay: `${allPatterns.indexOf(pattern) * 40}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <p className="text-xs font-medium leading-tight">
              {patternLabels[pattern] ?? pattern.replace(/_/g, ' ')}
            </p>
            <p className="mt-1 text-lg font-bold">
              {stat.total > 0 ? `${stat.mastered}/${stat.total}` : '-'}
            </p>
            <p className="text-[10px] uppercase tracking-wider opacity-70">
              {dominant.replace(/_/g, ' ')}
            </p>
            <span className="sr-only">
              {dominant === 'MASTERED'
                ? 'Mastered'
                : dominant === 'IN_PROGRESS'
                  ? 'In progress'
                  : dominant === 'NEEDS_REFRESH'
                    ? 'Needs refresh'
                    : 'Unseen'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default PatternHeatmap;
