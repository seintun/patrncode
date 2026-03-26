'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGuestId } from '@/hooks/useGuestId';

interface ProblemInfo {
  id: string;
  title: string;
  slug: string;
  pattern: string;
  difficulty: string;
}

interface RecentSession {
  id: string;
  outcome: 'SOLVED' | 'PARTIALLY_SOLVED' | 'NOT_SOLVED' | null;
  startedAt: string;
  problem: ProblemInfo;
}

interface NeedsRefreshItem {
  problem: ProblemInfo;
  nextReviewAt: string | null;
}

interface DashboardData {
  stats: {
    totalSolved: number;
    patternsPracticed: number;
    sessionsThisWeek: number;
  };
  recentSessions: RecentSession[];
  needsRefresh: NeedsRefreshItem[];
  inProgressProblems: Array<{ problem: ProblemInfo; attemptCount: number }>;
  recommendedProblem: ProblemInfo | null;
}

const outcomeBadgeLevel: Record<string, 'Easy' | 'Medium' | 'Hard'> = {
  SOLVED: 'Easy',
  PARTIALLY_SOLVED: 'Medium',
  NOT_SOLVED: 'Hard',
};

const outcomeLabel: Record<string, string> = {
  SOLVED: 'Solved',
  PARTIALLY_SOLVED: 'Partial',
  NOT_SOLVED: 'Not Solved',
};

export default function DashboardPage() {
  const guestId = useGuestId();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guestId) return;

    async function fetchDashboard() {
      try {
        const res = await fetch(`/api/progress?guestId=${guestId}`);
        if (!res.ok) throw new Error('Failed to load dashboard');
        const json = await res.json();
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, [guestId]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>

      {loading ? (
        <DashboardSkeleton />
      ) : !data ? (
        <EmptyDashboard />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="Problems Solved" value={data.stats.totalSolved} />
            <StatCard label="Patterns Practiced" value={data.stats.patternsPracticed} />
            <StatCard label="Sessions This Week" value={data.stats.sessionsThisWeek} />
          </div>

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
                      <Badge variant="mastery" state="NEEDS_REFRESH" />
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {data.recommendedProblem && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
                Recommended Next
              </h2>
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/practice/${data.recommendedProblem.slug}`}
                      className="text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-accent)]"
                    >
                      {data.recommendedProblem.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge
                        variant="difficulty"
                        level={
                          data.recommendedProblem.difficulty === 'EASY'
                            ? 'Easy'
                            : data.recommendedProblem.difficulty === 'MEDIUM'
                              ? 'Medium'
                              : 'Hard'
                        }
                      />
                      <Badge
                        variant="pattern"
                        label={data.recommendedProblem.pattern.replace(/_/g, ' ')}
                      />
                    </div>
                  </div>
                  <Link href={`/practice/${data.recommendedProblem.slug}`}>
                    <Button size="sm">Start</Button>
                  </Link>
                </div>
              </Card>
            </section>
          )}

          {data.recentSessions.length > 0 && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">
                Recent Sessions
              </h2>
              <div className="space-y-2">
                {data.recentSessions.map((session) => (
                  <Card key={session.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">
                          {session.problem.title}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          {new Date(session.startedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="pattern"
                          label={session.problem.pattern.replace(/_/g, ' ')}
                        />
                        {session.outcome && (
                          <Badge variant="difficulty" level={outcomeBadgeLevel[session.outcome]} />
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-center">
            <Link href="/practice">
              <Button variant="primary">Start Practicing</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="text-center">
      <p className="text-3xl font-bold text-[var(--color-accent)]">{value}</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">{label}</p>
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-40" />
      <Skeleton className="h-40" />
    </div>
  );
}

function EmptyDashboard() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <p className="mb-4 text-lg text-[var(--color-text-secondary)]">
        No activity yet. Start your first practice session!
      </p>
      <Link href="/practice">
        <Button>Browse Problems</Button>
      </Link>
    </div>
  );
}
