'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface Recommendation {
  problemId: string | null;
  slug: string | null;
  title: string | null;
  pattern: string | null;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | null;
  reason: string;
}

export function RecommendedProblem() {
  const [data, setData] = useState<Recommendation | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    async function fetchRecommendation() {
      try {
        const res = await fetch('/api/recommendations/next', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to load recommendation');
        const json = (await res.json()) as Recommendation;
        setData(json);
      } catch {
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendation();
  }, []);

  if (loading) {
    return (
      <Card className="p-4">
        <p className="text-sm text-[var(--color-text-muted)]">Loading recommendation...</p>
      </Card>
    );
  }

  if (!data || !data.problemId || !data.slug || !data.title) {
    return null;
  }

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)]">
          Recommended for You
        </h3>
        <button
          type="button"
          onClick={() => setShowWhy((v) => !v)}
          className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          Why?
        </button>
      </div>
      <div className="space-y-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)]">{data.title}</p>
        <div className="flex flex-wrap gap-2">
          {data.pattern && <Badge variant="pattern" value={data.pattern.replace(/_/g, ' ')} />}
          {data.difficulty && <Badge variant="difficulty" value={data.difficulty} />}
        </div>
        {showWhy && <p className="text-xs text-[var(--color-text-muted)]">{data.reason}</p>}
        <Link href={`/practice/${data.slug}`}>
          <Button size="sm">Start Problem</Button>
        </Link>
      </div>
    </Card>
  );
}

export default RecommendedProblem;
