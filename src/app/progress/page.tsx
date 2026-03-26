'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { PatternHeatmap } from '@/components/domain/PatternHeatmap';
import { useGuestId } from '@/hooks/useGuestId';
import type { Pattern, MasteryState } from '@/generated/prisma/enums';

interface ProblemHistoryItem {
  mastery: MasteryState;
  attemptCount: number;
  solveCount: number;
  lastAttemptedAt: string | null;
  problem: {
    id: string;
    title: string;
    slug: string;
    pattern: string;
    difficulty: string;
  };
}

interface PatternStat {
  pattern: Pattern;
  total: number;
  mastered: number;
  inProgress: number;
  needsRefresh: number;
  unseen: number;
}

interface NeedsRefreshItem {
  problem: {
    id: string;
    title: string;
    slug: string;
    pattern: string;
    difficulty: string;
  };
  nextReviewAt: string | null;
}

interface ProgressData {
  patternStats: PatternStat[];
  problemHistory: ProblemHistoryItem[];
  needsRefresh: NeedsRefreshItem[];
}

export default function ProgressPage() {
  const guestId = useGuestId();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guestId) return;

    async function fetchProgress() {
      try {
        const res = await fetch(`/api/progress?guestId=${guestId}`);
        if (!res.ok) throw new Error('Failed to load progress');
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [guestId]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">Progress</h1>

      {loading ? (
        <ProgressSkeleton />
      ) : !data ? (
        <EmptyProgress />
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
              Pattern Mastery
            </h2>
            <PatternHeatmap stats={data.patternStats} />
          </section>

          {data.needsRefresh.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
                Retest Today
              </h2>
              <div className="space-y-2">
                {data.needsRefresh.map((item) => (
                  <Card key={item.problem.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <Link
                          href={`/practice/${item.problem.slug}`}
                          className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
                        >
                          {item.problem.title}
                        </Link>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge
                            variant="difficulty"
                            level={
                              item.problem.difficulty === 'EASY'
                                ? 'Easy'
                                : item.problem.difficulty === 'MEDIUM'
                                  ? 'Medium'
                                  : 'Hard'
                            }
                          />
                          <Badge
                            variant="pattern"
                            label={item.problem.pattern.replace(/_/g, ' ')}
                          />
                        </div>
                      </div>
                      <Link href={`/practice/${item.problem.slug}`}>
                        <Button size="sm" variant="secondary">
                          Retest
                        </Button>
                      </Link>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {data.problemHistory.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
                Problem History
              </h2>
              <Card className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-[var(--color-border)] text-xs text-[var(--color-text-muted)]">
                      <th className="pb-2 pr-4 font-medium">Problem</th>
                      <th className="pb-2 pr-4 font-medium">Pattern</th>
                      <th className="pb-2 pr-4 font-medium">Mastery</th>
                      <th className="pb-2 pr-4 font-medium">Attempts</th>
                      <th className="pb-2 font-medium">Last Attempt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.problemHistory.map((item) => (
                      <tr
                        key={item.problem.id}
                        className="border-b border-[var(--color-border-subtle)] last:border-0"
                      >
                        <td className="py-2 pr-4">
                          <Link
                            href={`/practice/${item.problem.slug}`}
                            className="text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
                          >
                            {item.problem.title}
                          </Link>
                        </td>
                        <td className="py-2 pr-4">
                          <Badge
                            variant="pattern"
                            label={item.problem.pattern.replace(/_/g, ' ')}
                          />
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="mastery" state={item.mastery} />
                        </td>
                        <td className="py-2 pr-4 text-[var(--color-text-secondary)]">
                          {item.solveCount}/{item.attemptCount} solved
                        </td>
                        <td className="py-2 text-[var(--color-text-muted)]">
                          {item.lastAttemptedAt
                            ? new Date(item.lastAttemptedAt).toLocaleDateString()
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function ProgressSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="mb-3 h-6 w-32" />
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 14 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-60" />
    </div>
  );
}

function EmptyProgress() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="mb-4 text-lg text-[var(--color-text-secondary)]">
        No progress data yet. Start practicing to see your patterns!
      </p>
      <Link href="/practice">
        <Button>Browse Problems</Button>
      </Link>
    </div>
  );
}
