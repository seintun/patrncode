'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { getGuestId } from '@/lib/guest';
import JsonLdSchema from '@/components/seo/JsonLdSchema';

interface ProblemDetail {
  id: string;
  title: string;
  slug: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  pattern: string;
  statement: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  constraints: string[];
  starterCode: string;
  approaches: Array<{ name: string; description: string; complexity: string }> | null;
  testCases: Array<{
    id: string;
    input: string;
    expected: string;
    isHidden: boolean;
    order: number;
  }>;
  updatedAt: Date | string;
  tags?: string[];
  sourceType?: string;
  externalUrl?: string | null;
}

type SessionMode = 'SELF_PRACTICE' | 'COACH_ME' | 'MOCK_INTERVIEW';

const MODES: Array<{ id: SessionMode; title: string; description: string }> = [
  {
    id: 'SELF_PRACTICE',
    title: 'Self-Practice',
    description: 'Solve on your own with test feedback. Get hints when stuck.',
  },
  {
    id: 'COACH_ME',
    title: 'Coach Me',
    description: 'AI coach guides you through the problem step-by-step.',
  },
  {
    id: 'MOCK_INTERVIEW',
    title: 'Mock Interview',
    description: 'Simulate a real interview with an AI interviewer.',
  },
];

function formatPattern(pattern: string): string {
  return pattern
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

interface ProblemDetailClientProps {
  problem: ProblemDetail;
}

export default function ProblemDetailClient({ problem }: ProblemDetailClientProps) {
  const difficultyLabel =
    problem.difficulty === 'HARD' ? 'HARD' : problem.difficulty === 'MEDIUM' ? 'MEDIUM' : 'EASY';

  // Build FAQ schema for the problem
  const plainStatement = problem.statement
    .replace(/[#*`\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 1000);

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `How do I solve ${problem.title}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: plainStatement,
        },
      },
    ],
  };

  return (
    <>
      <JsonLdSchema schema={faqSchema} />
      <ErrorBoundary>
        <ProblemDetailContent problem={problem} difficultyLabel={difficultyLabel} />
      </ErrorBoundary>
    </>
  );
}

function ProblemDetailContent({
  problem,
  difficultyLabel,
}: {
  problem: ProblemDetail;
  difficultyLabel: 'EASY' | 'MEDIUM' | 'HARD';
}) {
  const router = useRouter();
  const [selectedMode, setSelectedMode] = useState<SessionMode>('SELF_PRACTICE');
  const [starting, setStarting] = useState(false);

  const handleStartSession = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guestId: getGuestId(),
          problemId: problem.id,
          mode: selectedMode,
        }),
      });
      if (!res.ok) throw new Error('Failed to create session');
      const session = await res.json();
      router.push(`/session/${session.id}`);
    } catch {
      setStarting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">{problem.title}</h1>
        <Badge variant="difficulty" value={difficultyLabel} />
        <Badge variant="pattern" value={formatPattern(problem.pattern)} />
      </div>

      <div className="mb-8">
        <div className="prose prose-invert max-w-none prose-headings:text-[var(--color-text-primary)] prose-p:text-[var(--color-text-secondary)] prose-strong:text-[var(--color-text-primary)] prose-code:text-[var(--color-accent)]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.statement}</ReactMarkdown>
        </div>
      </div>

      {problem.examples.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">Examples</h2>
          <div className="space-y-4">
            {problem.examples.map((ex, i) => (
              <Card key={i}>
                <p className="mb-1 text-sm font-medium text-[var(--color-text-muted)]">
                  Example {i + 1}
                </p>
                <div className="mb-2 font-mono text-sm">
                  <span className="text-[var(--color-text-muted)]">Input: </span>
                  <span className="text-[var(--color-text-primary)]">{ex.input}</span>
                </div>
                <div className="mb-2 font-mono text-sm">
                  <span className="text-[var(--color-text-muted)]">Output: </span>
                  <span className="text-[var(--color-text-primary)]">{ex.output}</span>
                </div>
                {ex.explanation && (
                  <p className="text-sm text-[var(--color-text-secondary)]">{ex.explanation}</p>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">Constraints</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--color-text-secondary)]">
          {problem.constraints.map((c, i) => (
            <li key={i} className="font-mono">
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">Select Mode</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODES.map((mode) => (
            <Card
              key={mode.id}
              onClick={() => setSelectedMode(mode.id)}
              className={
                selectedMode === mode.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-bg-elevated)]'
                  : ''
              }
            >
              <h3 className="mb-1 font-semibold text-[var(--color-text-primary)]">{mode.title}</h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{mode.description}</p>
            </Card>
          ))}
        </div>
      </div>

      <Button onClick={handleStartSession} disabled={starting} size="lg">
        {starting ? 'Starting...' : 'Start Session'}
      </Button>
    </div>
  );
}
