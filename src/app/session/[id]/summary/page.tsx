'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';

interface SummaryData {
  id: string;
  problemId: string;
  problem: {
    title: string;
    slug: string;
    pattern: string;
    difficulty: string;
  };
  outcome: 'SOLVED' | 'PARTIALLY_SOLVED' | 'NOT_SOLVED' | null;
  startedAt: string;
  completedAt: string | null;
  feedback: {
    strengths: string;
    weaknesses: string;
    suggestions: string;
    complexityNote: string;
  } | null;
  runs: Array<{ passed: number; total: number }>;
  hints: Array<{ id: string }>;
}

const outcomeBadgeLevel: Record<string, 'EASY' | 'MEDIUM' | 'HARD'> = {
  SOLVED: 'EASY',
  PARTIALLY_SOLVED: 'MEDIUM',
  NOT_SOLVED: 'HARD',
};

export default function SessionSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSummary() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) {
          throw new Error('Failed to load session');
        }
        const sessionData = await res.json();

        if (sessionData.status !== 'COMPLETED') {
          router.replace(`/session/${sessionId}`);
          return;
        }

        setData(sessionData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, [sessionId, router]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <Skeleton className="mb-6 h-10 w-1/2" />
        <Skeleton className="mb-4 h-32 w-full" />
        <Skeleton className="mb-4 h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg text-[var(--color-error)]">{error ?? 'Session not found'}</p>
          <Link href="/practice" className="text-sm text-[var(--color-accent)] hover:underline">
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  const latestRun = data.runs[0];
  const passed = latestRun?.passed ?? 0;
  const total = latestRun?.total ?? 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const startTime = new Date(data.startedAt).getTime();
  const endTime = data.completedAt ? new Date(data.completedAt).getTime() : Date.now();
  const timeSpentSeconds = Math.floor((endTime - startTime) / 1000);
  const timeMinutes = Math.round(timeSpentSeconds / 60);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Session Complete</h1>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{data.problem.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="pattern" value={data.problem.pattern.replace(/_/g, ' ')} />
          {data.outcome && <Badge variant="difficulty" value={outcomeBadgeLevel[data.outcome]} />}
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">{timeMinutes}m</p>
          <p className="text-xs text-[var(--color-text-muted)]">Time Spent</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">{data.hints.length}</p>
          <p className="text-xs text-[var(--color-text-muted)]">Hints Used</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[var(--color-accent)]">{passRate}%</p>
          <p className="text-xs text-[var(--color-text-muted)]">
            Test Pass Rate ({passed}/{total})
          </p>
        </Card>
      </div>

      {data.feedback && (
        <div className="mb-6 space-y-4">
          <FeedbackSection
            title="Strengths"
            content={data.feedback.strengths}
            color="var(--color-success)"
          />
          <FeedbackSection
            title="Areas for Improvement"
            content={data.feedback.weaknesses}
            color="var(--color-warning)"
          />
          <FeedbackSection
            title="Suggestions"
            content={data.feedback.suggestions}
            color="var(--color-accent)"
          />
          <FeedbackSection
            title="Complexity Note"
            content={data.feedback.complexityNote}
            color="var(--color-ai-coach)"
          />
        </div>
      )}

      <div className="flex gap-3">
        <Link href={`/practice/${data.problem.slug}`}>
          <Button variant="primary">Practice Again</Button>
        </Link>
        <Link href="/practice">
          <Button variant="secondary">Next Problem</Button>
        </Link>
        <Link href="/practice">
          <Button variant="ghost">Back to Practice</Button>
        </Link>
      </div>
    </div>
  );
}

function FeedbackSection({
  title,
  content,
  color,
}: {
  title: string;
  content: string;
  color: string;
}) {
  return (
    <Card>
      <h3 className="mb-2 text-sm font-semibold" style={{ color }}>
        {title}
      </h3>
      <div className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">
        {content}
      </div>
    </Card>
  );
}
