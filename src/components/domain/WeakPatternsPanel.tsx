'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

interface WeakPattern {
  pattern: string;
  confidenceScore: number;
}

export function WeakPatternsPanel() {
  const [patterns, setPatterns] = useState<WeakPattern[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPatterns() {
      try {
        const res = await fetch('/api/progress', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch progress');
        const data = await res.json();
        const weak = Array.isArray(data?.weakPatterns) ? data.weakPatterns : [];
        setPatterns(weak.slice(0, 5));
      } catch {
        setPatterns([]);
      } finally {
        setLoading(false);
      }
    }
    loadPatterns();
  }, []);

  return (
    <Card className="p-4">
      <h3 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
        Your Weak Patterns
      </h3>
      {loading ? (
        <p className="text-xs text-[var(--color-text-muted)]">Loading...</p>
      ) : patterns.length === 0 ? (
        <p className="text-xs text-[var(--color-text-muted)]">
          No weak-pattern data yet. Complete a few sessions and run tests to generate it.
        </p>
      ) : (
        <div className="space-y-2">
          {patterns.map((item) => (
            <div key={item.pattern} className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-text-secondary)]">
                {item.pattern.replace(/_/g, ' ')}
              </span>
              <span className="font-medium text-[var(--color-text-primary)]">
                {Math.round(item.confidenceScore * 100)}%
              </span>
            </div>
          ))}
          <Link href="/roadmap" className="pt-2 inline-block">
            <Button size="sm" variant="secondary">
              Practice Now
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

export default WeakPatternsPanel;
