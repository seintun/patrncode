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
import { SOPHIA_MODES } from '@/lib/sophia';

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
    title: 'Solo Practice',
    description: 'Solve on your own with test feedback. Ask Sophia for hints when stuck.',
  },
  {
    id: 'COACH_ME',
    title: 'Coach Me (Sophia)',
    description: 'Sophia guides you through the problem step-by-step.',
  },
  {
    id: 'MOCK_INTERVIEW',
    title: 'Mock Interview with Sophia',
    description: 'Simulate a real interview with Sophia as your interviewer.',
  },
];

const MODE_IMAGES: Record<SessionMode, string> = {
  SELF_PRACTICE: SOPHIA_MODES.SELF_PRACTICE.sceneImage,
  COACH_ME: SOPHIA_MODES.COACH_ME.sceneImage,
  MOCK_INTERVIEW: SOPHIA_MODES.MOCK_INTERVIEW.sceneImage,
};

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
      <div className="mb-6">
        <h1 className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">
          {problem.title}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="difficulty" value={difficultyLabel} />
          <Badge variant="pattern" value={formatPattern(problem.pattern)} />
        </div>
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
                <div className="mb-2 font-[family-name:var(--font-geist-mono)] text-sm">
                  <span className="text-[var(--color-text-muted)]">Input: </span>
                  <span className="text-[var(--color-text-primary)]">{ex.input}</span>
                </div>
                <div className="mb-2 font-[family-name:var(--font-geist-mono)] text-sm">
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
            <li key={i} className="font-[family-name:var(--font-geist-mono)]">
              {c}
            </li>
          ))}
        </ul>
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-[var(--color-text-primary)]">Select Mode</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {MODES.map((mode) => {
            const sophiaConfig = SOPHIA_MODES[mode.id];
            const isSelected = selectedMode === mode.id;
            return (
              <Card
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className="cursor-pointer overflow-hidden p-0 transition-transform active:scale-[0.98] sm:hover:scale-[1.02]"
                style={
                  isSelected
                    ? {
                        borderColor: sophiaConfig.colors.primary,
                        backgroundColor: sophiaConfig.colors.bg,
                      }
                    : {}
                }
              >
                {/* Mobile: image left, text right. sm+: image top, text below */}
                <div className="flex flex-row sm:flex-col">
                  <div className="relative h-28 w-28 shrink-0 sm:h-36 sm:w-full overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={MODE_IMAGES[mode.id]}
                      alt={mode.title}
                      className="h-full w-full object-cover"
                    />
                    {isSelected && (
                      <div
                        className="absolute inset-0"
                        style={{ backgroundColor: `${sophiaConfig.colors.primary}22` }}
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col justify-center p-3">
                    <h3
                      className="mb-1 font-semibold"
                      style={{
                        color: isSelected ? sophiaConfig.colors.text : 'var(--color-text-primary)',
                      }}
                    >
                      {mode.title}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)]">{mode.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center">
        <Button onClick={handleStartSession} disabled={starting} size="lg">
          {starting ? 'Starting...' : 'Start Session'}
        </Button>
      </div>
    </div>
  );
}
