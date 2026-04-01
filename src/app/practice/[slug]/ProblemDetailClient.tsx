'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import JsonLdSchema from '@/components/seo/JsonLdSchema';
import { SOPHIA_MODES } from '@/lib/sophia';
import { useCodeExecution } from '@/hooks/useCodeExecution';

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

interface AbandonedSession {
  id: string;
  mode: SessionMode;
  code: string | null;
  startedAt: string;
}

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
  const [activeSession, setActiveSession] = useState<{
    id: string;
    mode: SessionMode;
    expiresAt: string | null;
  } | null>(null);
  const [abandonedSession, setAbandonedSession] = useState<AbandonedSession | null>(null);
  const [loadingActive, setLoadingActive] = useState(true);
  const { prewarmWorker } = useCodeExecution();

  useEffect(() => {
    prewarmWorker();

    // Check for active session
    const checkActive = async () => {
      try {
        const res = await fetch(`/api/sessions?problemId=${problem.id}&includeAbandoned=true`, {
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (data.session) {
            setActiveSession(data.session);
            setAbandonedSession(null);
          } else {
            setAbandonedSession(data.abandonedSession ?? null);
          }
        }
      } catch (err) {
        console.error('Failed to check active session:', err);
      } finally {
        setLoadingActive(false);
      }
    };
    checkActive();
  }, [prewarmWorker, problem.id]);

  // Handle countdown for active session (must be at top level)
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    if (!activeSession?.expiresAt) {
      setTimeLeft('');
      return;
    }

    const expiresAt = activeSession.expiresAt;

    const updateTime = () => {
      const remaining = Math.max(0, new Date(expiresAt).getTime() - Date.now());
      const mins = Math.floor(remaining / 1000 / 60);
      const secs = Math.floor((remaining / 1000) % 60);
      setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      if (remaining <= 0) {
        setActiveSession(null);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [activeSession?.expiresAt]);

  const handleStartSession = async () => {
    setStarting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          mode: selectedMode,
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        id?: string;
        sessionId?: string;
      } | null;

      if (res.status === 409 && payload?.sessionId) {
        router.push(`/session/${payload.sessionId}`);
        return;
      }

      if (!res.ok || !payload?.id) {
        throw new Error('Failed to create session');
      }

      router.push(`/session/${payload.id}`);
    } catch {
      setStarting(false);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      const res = await fetch(`/api/sessions/${activeSession.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ABANDONED' }),
      });
      if (res.ok) {
        setActiveSession(null);
      }
    } catch (err) {
      console.error('Failed to end session:', err);
    }
  };

  const handleResumeAbandonedSession = async () => {
    if (!abandonedSession) return;
    setStarting(true);
    try {
      const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemId: problem.id,
          mode: abandonedSession.mode,
          previousSessionId: abandonedSession.id,
        }),
      });
      const payload = (await res.json().catch(() => null)) as {
        id?: string;
        sessionId?: string;
      } | null;

      if (res.status === 409 && payload?.sessionId) {
        router.push(`/session/${payload.sessionId}`);
        return;
      }

      if (!res.ok || !payload?.id) {
        throw new Error('Failed to resume abandoned session');
      }

      router.push(`/session/${payload.id}`);
    } catch {
      setStarting(false);
    }
  };

  if (loadingActive) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-[var(--color-accent)]" />
      </div>
    );
  }

  if (activeSession) {
    const sophiaConfig = SOPHIA_MODES[activeSession.mode];

    return (
      <div className="mx-auto max-w-4xl px-4 py-8" style={{ animation: 'scaleIn 0.4s ease-out' }}>
        <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 text-center shadow-xl">
          <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--color-accent)] shadow-lg">
            <img
              src={MODE_IMAGES[activeSession.mode]}
              alt={activeSession.mode}
              className="h-full w-full object-cover"
            />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">
            Active Session Found
          </h2>
          <div className="mb-6 flex flex-col items-center gap-1">
            <p className="text-[var(--color-text-secondary)]">
              You already have an active{' '}
              <span style={{ color: sophiaConfig.colors.text }} className="font-semibold">
                {activeSession.mode.replace('_', ' ')}
              </span>{' '}
              session for this problem.
            </p>
            {timeLeft && (
              <p className="flex items-center gap-1.5 text-sm font-mono font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-elevated)] px-3 py-1 rounded-full border border-[var(--color-border)]">
                <span className="inline-block w-2 h-2 rounded-full bg-[var(--color-accent)] animate-pulse" />
                {timeLeft} remaining
              </p>
            )}
          </div>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={() => router.push(`/session/${activeSession.id}`)}
              size="lg"
              className="min-w-[200px]"
              style={{
                backgroundColor: sophiaConfig.colors.primary,
                boxShadow: `0 8px 30px -4px ${sophiaConfig.colors.primary}44`,
              }}
            >
              Resume Session
            </Button>
            <Button
              variant="secondary"
              onClick={handleEndSession}
              size="lg"
              className="bg-transparent border-[var(--color-error)] text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white"
            >
              End Session to Switch Mode
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

      {abandonedSession && (
        <Card className="mb-8 p-6">
          <h2 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            Previous Session Available
          </h2>
          <p className="mb-4 text-sm text-[var(--color-text-secondary)]">
            You can resume your previous code from an abandoned session, or start fresh.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button onClick={handleResumeAbandonedSession} disabled={starting}>
              {starting ? 'Starting...' : 'Resume with Previous Code'}
            </Button>
            <Button variant="secondary" onClick={handleStartSession} disabled={starting}>
              Start Fresh
            </Button>
          </div>
        </Card>
      )}

      {!abandonedSession && (
        <div className="flex justify-center">
          <Button onClick={handleStartSession} disabled={starting} size="lg">
            {starting ? 'Starting...' : 'Start Session'}
          </Button>
        </div>
      )}
    </div>
  );
}
