'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useUser } from '@/hooks/useUser';
import Link from 'next/link';

interface Stats {
  totalSolved: number;
  patternsPracticed: number;
  sessionsThisWeek: number;
}

interface Problem {
  id: string;
  title: string;
  slug: string;
  pattern: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}

interface Session {
  id: string;
  outcome: 'SOLVED' | 'PARTIALLY_SOLVED' | 'NOT_SOLVED' | string;
  startedAt: string;
  completedAt: string | null;
  problem: Problem;
}

export default function DashboardPage() {
  const user = useUser();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [needsRefresh, setNeedsRefresh] = useState<Problem[]>([]);
  const [recommended, setRecommended] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams();
      if (user) params.set('userId', user.id);

      const res = await fetch(`/api/progress?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentSessions(data.recentSessions);
        setNeedsRefresh(data.needsRefresh);
        setRecommended(data.recommendedProblem);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-32 w-full animate-pulse rounded-lg bg-[var(--color-bg-secondary)]" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-[var(--color-bg-secondary)]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="p-6">
        <h1 className="mb-6 text-3xl font-bold text-[var(--color-text-primary)]">Dashboard</h1>

        {/* Quick Stats */}
        <div className="mb-8 grid gap-6 grid-cols-1 md:grid-cols-3">
          <Card className="p-6">
            <div className="text-sm text-[var(--color-text-muted)]">Problems Solved</div>
            <div className="text-4xl font-bold text-[var(--color-accent)]">
              {stats?.totalSolved ?? 0}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-[var(--color-text-muted)]">Patterns Practiced</div>
            <div className="text-4xl font-bold text-[var(--color-accent)]">
              {stats?.patternsPracticed ?? 0}
            </div>
          </Card>
          <Card className="p-6">
            <div className="text-sm text-[var(--color-text-muted)]">Sessions This Week</div>
            <div className="text-4xl font-bold text-[var(--color-accent)]">
              {stats?.sessionsThisWeek ?? 0}
            </div>
          </Card>
        </div>

        {/* Recommendations */}
        <section className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
            Today&apos;s Suggestions
          </h2>
          {needsRefresh.length > 0 ? (
            <div className="space-y-3">
              {needsRefresh.map((p) => (
                <Card key={p.id} className="p-4 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-[var(--color-text-primary)]">{p.title}</div>
                    <div className="text-sm text-[var(--color-text-secondary)]">
                      <Badge variant="pattern" value={p.pattern.replace('_', ' ')} />
                      <Badge variant="difficulty" value={p.difficulty} />
                    </div>
                  </div>
                  <Link href={`/practice/${p.slug}`}>
                    <Button size="sm">Practice</Button>
                  </Link>
                </Card>
              ))}
            </div>
          ) : recommended ? (
            <Card className="p-4 flex justify-between items-center">
              <div>
                <div className="font-medium text-[var(--color-text-primary)]">
                  {recommended.title}
                </div>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  <Badge variant="pattern" value={recommended.pattern.replace('_', ' ')} />
                  <Badge variant="difficulty" value={recommended.difficulty} />
                </div>
              </div>
              <Link href={`/practice/${recommended.slug}`}>
                <Button size="sm">Start</Button>
              </Link>
            </Card>
          ) : (
            <p className="text-[var(--color-text-secondary)]">
              No recommendations yet. Start practicing!
            </p>
          )}
        </section>

        {/* Recent Sessions */}
        <section>
          <h2 className="mb-4 text-xl font-semibold text-[var(--color-text-primary)]">
            Recent Sessions
          </h2>
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((s) => {
                const outcome = s.outcome as 'SOLVED' | 'PARTIALLY_SOLVED' | 'NOT_SOLVED';
                return (
                  <Card key={s.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">
                          {s.problem.title}
                        </div>
                        <div className="text-sm text-[var(--color-text-muted)]">
                          {new Date(s.startedAt).toLocaleDateString()}
                        </div>
                      </div>
                      <Badge variant="outcome" value={outcome} />
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-[var(--color-text-secondary)]">No sessions yet.</p>
          )}
        </section>
      </div>
    </ErrorBoundary>
  );
}
