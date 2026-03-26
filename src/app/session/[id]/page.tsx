'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SessionLayout } from '@/components/domain/SessionLayout';
import { ProblemPanel } from '@/components/domain/ProblemPanel';
import { CodeEditor } from '@/components/domain/CodeEditor';
import { TestResults } from '@/components/domain/TestResults';
import { CoachingPanel } from '@/components/domain/CoachingPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { SessionMode } from '@/generated/prisma/enums';

interface TestCase {
  id: string;
  input: string;
  expected: string;
  isHidden: boolean;
  order: number;
}

interface SessionData {
  id: string;
  guestId: string;
  problemId: string;
  mode: SessionMode;
  status: string;
  code: string | null;
  problem: {
    id: string;
    title: string;
    statement: string;
    examples: unknown[];
    constraints: string[];
    starterCode: string;
    testCases: TestCase[];
  };
  runs: Array<{
    id: string;
    code: string;
    results: unknown;
    passed: number;
    total: number;
    createdAt: string;
  }>;
  hints: Array<{
    id: string;
    level: number;
    content: string;
    createdAt: string;
  }>;
}

export default function SessionPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [notes, setNotes] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) {
          throw new Error('Failed to load session');
        }
        const data = await res.json();
        setSession(data);
        setCode(data.code ?? data.problem.starterCode ?? '');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  const handleCodeChange = async (newCode: string) => {
    setCode(newCode);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: newCode }),
      });
    } catch {
      // Auto-save failure is non-critical
    }
  };

  const handleHintRequest = (level: number) => {
    setHintLevel(level);
    // Hint AI integration wired in Phase 4
  };

  const handleEndSession = async () => {
    setCompleting(true);
    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const res = await fetch(`/api/sessions/${sessionId}/complete`, {
        method: 'POST',
      });

      if (!res.ok) {
        throw new Error('Failed to complete session');
      }

      router.push(`/session/${sessionId}/summary`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to end session');
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-57px)]">
        <div className="hidden h-full md:grid md:grid-cols-[30%_40%_30%]">
          <div className="border-r border-[var(--color-border)] p-4">
            <Skeleton className="mb-4 h-8 w-3/4" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="border-r border-[var(--color-border)] p-4">
            <Skeleton className="h-full w-full" />
          </div>
          <div className="p-4">
            <Skeleton className="mb-4 h-8 w-1/2" />
            <Skeleton className="h-full w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !session) {
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

  const examples = (session.problem.examples ?? []) as Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;

  const testResults =
    session.runs.length > 0
      ? (session.runs[0].results as Array<{
          input: string;
          expected: string;
          actual: string;
          passed: boolean;
          error?: string;
          isHidden: boolean;
        }>)
      : [];

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 py-2">
        <span className="text-sm font-medium text-[var(--color-text-primary)]">
          {session.problem.title}
        </span>
        <Button variant="secondary" size="sm" onClick={handleEndSession} disabled={completing}>
          {completing ? 'Ending...' : 'End Session'}
        </Button>
      </div>
      <div className="flex-1 min-h-0">
        <SessionLayout
          problem={
            <ProblemPanel
              problem={{
                title: session.problem.title,
                statement: session.problem.statement,
                examples,
                constraints: session.problem.constraints,
              }}
              notes={notes}
              onNotesChange={setNotes}
            />
          }
          editor={<CodeEditor value={code} onChange={handleCodeChange} />}
          testResults={
            <TestResults
              results={testResults}
              passedCount={session.runs[0]?.passed ?? 0}
              totalCount={session.runs[0]?.total ?? 0}
            />
          }
          coach={
            <CoachingPanel
              mode={session.mode}
              onHintRequest={handleHintRequest}
              hintLevel={hintLevel}
            />
          }
        />
      </div>
    </div>
  );
}
