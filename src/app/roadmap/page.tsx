'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useRoadmapCompletion } from '@/hooks/useRoadmapCompletion';
import { RecommendedProblem } from '@/components/domain/RecommendedProblem';

interface RoadmapProblem {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  pattern: string;
  leetcodeNumber?: number | null;
  mastery: string | null;
  curatedOrder: number | null;
}

type FilterTab = 'all' | 'not_started' | 'in_progress' | 'mastered' | 'needs_refresh';

const FILTER_TABS: Array<{ key: FilterTab; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'mastered', label: 'Mastered' },
  { key: 'needs_refresh', label: 'Weak' },
];

const MASTERY_COLORS: Record<string, string> = {
  unseen: 'bg-[var(--color-text-muted)]',
  in_progress: 'bg-[var(--color-warning)]',
  mastered: 'bg-[var(--color-success)]',
  needs_refresh: 'bg-[var(--color-info)]',
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: 'text-[var(--color-success)]',
  MEDIUM: 'text-[var(--color-warning)]',
  HARD: 'text-[var(--color-error)]',
};

function getMasteryKey(mastery: string | null): string {
  return (mastery ?? 'unseen').toLowerCase();
}

export default function RoadmapPage() {
  const [problems, setProblems] = useState<RoadmapProblem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [copied, setCopied] = useState(false);

  useRoadmapCompletion(problems);

  useEffect(() => {
    async function fetchProblems() {
      try {
        const res = await fetch('/api/problems?curated=true');
        if (!res.ok) throw new Error('Failed to load problems');
        const json = await res.json();
        setProblems(json);
      } catch {
        setProblems([]);
      } finally {
        setLoading(false);
      }
    }

    fetchProblems();
  }, []);

  const masteredCount = problems.filter((p) => p.mastery === 'MASTERED').length;
  const totalCount = 75;
  const percentage = totalCount > 0 ? Math.round((masteredCount / totalCount) * 100) : 0;

  const filteredProblems = problems.filter((p) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'not_started') return !p.mastery || p.mastery === 'UNSEEN';
    if (activeFilter === 'in_progress') return p.mastery === 'IN_PROGRESS';
    if (activeFilter === 'mastered') return p.mastery === 'MASTERED';
    if (activeFilter === 'needs_refresh') return p.mastery === 'NEEDS_REFRESH';
    return true;
  });

  const handleShare = async () => {
    const text = `I just completed all 75 problems on SophoCode! 🎉\n#coding #interviewprep #SophoCode`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard write failed silently
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <ErrorBoundary>
        {loading ? (
          <RoadmapSkeleton />
        ) : (
          <div className="space-y-6">
            <RecommendedProblem />

            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">SophoCode 75</h1>
              <div className="flex items-center gap-3">
                <span className="text-sm text-[var(--color-text-secondary)]">
                  {masteredCount}/{totalCount} Mastered
                </span>
                {masteredCount >= 75 && (
                  <Button size="sm" variant="secondary" onClick={handleShare}>
                    {copied ? 'Copied!' : 'Share'}
                  </Button>
                )}
              </div>
            </div>

            <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--color-bg-elevated)]">
              <div
                className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <p className="text-right text-xs text-[var(--color-text-muted)]">{percentage}%</p>

            <div className="flex flex-wrap gap-2">
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveFilter(tab.key)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    activeFilter === tab.key
                      ? 'bg-[var(--color-accent)] text-[var(--color-bg-primary)]'
                      : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {filteredProblems.length === 0 ? (
              <p className="py-12 text-center text-[var(--color-text-muted)]">
                No problems match this filter.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {filteredProblems.map((problem) => (
                  <Link key={problem.id} href={`/practice/${problem.slug}`}>
                    <Card className="flex flex-col items-center gap-2 p-4 text-center transition-colors hover:border-[var(--color-accent)]/30">
                      <span className="text-lg font-bold text-[var(--color-text-primary)]">
                        {problem.curatedOrder ?? '-'}
                      </span>
                      {problem.leetcodeNumber ? (
                        <span className="text-[10px] font-semibold text-[var(--color-text-muted)]">
                          LC #{problem.leetcodeNumber}
                        </span>
                      ) : null}
                      <div
                        className={`h-3 w-3 rounded-full ${MASTERY_COLORS[getMasteryKey(problem.mastery)]}`}
                        title={problem.mastery ?? 'UNSEEN'}
                      />
                      <p className="line-clamp-2 text-xs font-medium text-[var(--color-text-secondary)]">
                        {problem.title}
                      </p>
                      <span
                        className={`text-xs font-semibold ${DIFFICULTY_COLORS[problem.difficulty]}`}
                      >
                        {problem.difficulty === 'EASY'
                          ? 'Easy'
                          : problem.difficulty === 'MEDIUM'
                            ? 'Med'
                            : 'Hard'}
                      </span>
                      <Badge
                        variant="pattern"
                        value={problem.pattern.replace(/_/g, ' ')}
                        className="text-[10px]"
                      />
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </ErrorBoundary>
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-28" />
      </div>
      <Skeleton className="h-2.5 w-full rounded-full" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-lg" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
