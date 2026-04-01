'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface CustomProblemModalProps {
  open: boolean;
  onClose: () => void;
  isPremium: boolean;
}

interface GeneratedProblem {
  requestId: string;
  title: string;
  statement: string;
  starterCode: string;
}

const PATTERNS = [
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
] as const;

export function CustomProblemModal({ open, onClose, isPremium }: CustomProblemModalProps) {
  const [pattern, setPattern] = useState<(typeof PATTERNS)[number]>('SLIDING_WINDOW');
  const [difficulty, setDifficulty] = useState<'EASY' | 'MEDIUM' | 'HARD'>('MEDIUM');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GeneratedProblem | null>(null);

  if (!open) return null;

  const generate = async () => {
    if (!isPremium) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern, difficulty }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? 'Failed to generate problem');
      setGenerated(json as GeneratedProblem);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate problem');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Generate Practice Problem
          </h3>
          <button onClick={onClose} className="text-[var(--color-text-muted)]">
            ×
          </button>
        </div>

        {!isPremium && (
          <p className="mb-4 text-sm text-[var(--color-warning)]">
            Premium required to generate custom problems.
          </p>
        )}

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-text-secondary)]">Pattern</span>
            <select
              value={pattern}
              onChange={(e) => setPattern(e.target.value as (typeof PATTERNS)[number])}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2"
            >
              {PATTERNS.map((p) => (
                <option key={p} value={p}>
                  {p.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm">
            <span className="mb-1 block text-[var(--color-text-secondary)]">Difficulty</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'EASY' | 'MEDIUM' | 'HARD')}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <Button onClick={generate} disabled={!isPremium || loading}>
            {loading ? 'Generating...' : 'Generate'}
          </Button>
          {generated && (
            <Button variant="secondary" onClick={generate} disabled={loading}>
              Regenerate
            </Button>
          )}
        </div>

        {error && <p className="mt-3 text-sm text-[var(--color-error)]">{error}</p>}

        {generated && (
          <div className="mt-5 rounded-lg border border-[var(--color-border)] p-4">
            <h4 className="text-base font-semibold text-[var(--color-text-primary)]">
              {generated.title}
            </h4>
            <p className="mt-2 line-clamp-6 whitespace-pre-wrap text-sm text-[var(--color-text-secondary)]">
              {generated.statement}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CustomProblemModal;
