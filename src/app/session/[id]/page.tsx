'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { SessionLayout } from '@/components/domain/SessionLayout';
import { ProblemPanel } from '@/components/domain/ProblemPanel';
import { CodeEditor } from '@/components/domain/CodeEditor';
import { TestResults } from '@/components/domain/TestResults';
import { CoachingPanel } from '@/components/domain/CoachingPanel';
import { Skeleton } from '@/components/ui/Skeleton';
import { AIBanner } from '@/components/ui/AIBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAIChat } from '@/hooks/useAIChat';
import { useCodeExecution } from '@/hooks/useCodeExecution';
import { Button } from '@/components/ui/Button';
import type { SessionMode } from '@/generated/prisma/enums';
import type { MobileWorkspaceHandle } from '@/components/domain/MobileWorkspace';

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
    pattern: string;
    difficulty: string;
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
  const sessionId = params.id as string;
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) {
          throw new Error('Failed to load session');
        }
        const data = await res.json();
        setSession(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchSession();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-57px)]" aria-busy="true" aria-live="polite">
        <div className="hidden h-full md:grid md:grid-cols-[30%_40%_30%]">
          <div className="border-r border-[var(--color-border)] p-4">
            <Skeleton className="mb-4 h-8 w-3/4" aria-label="Loading problem panel" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-5/6" />
            <Skeleton className="h-4 w-4/5" />
          </div>
          <div className="border-r border-[var(--color-border)] p-4">
            <Skeleton className="h-full w-full" aria-label="Loading code editor" />
          </div>
          <div className="p-4">
            <Skeleton className="mb-4 h-8 w-1/2" />
            <Skeleton className="h-full w-full" aria-label="Loading coaching panel" />
          </div>
        </div>
        {/* Mobile skeleton */}
        <div className="flex h-full flex-col md:hidden">
          <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <Skeleton className="mx-1 my-2 h-8 flex-1" />
            <Skeleton className="mx-1 my-2 h-8 flex-1" />
            <Skeleton className="mx-1 my-2 h-8 flex-1" />
          </div>
          <div className="flex-1 p-4">
            <Skeleton className="mb-4 h-8 w-3/4" aria-label="Loading content" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
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

  return <SessionContent session={session} sessionId={sessionId} />;
}

function SessionContent({ session, sessionId }: { session: SessionData; sessionId: string }) {
  const router = useRouter();
  const workspaceRef = useRef<MobileWorkspaceHandle>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState(session.code ?? session.problem.starterCode ?? '');
  const [notes, setNotes] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [showFailureButton, setShowFailureButton] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);

  const { run: runTests, results: testRunResults, isRunning } = useCodeExecution();

  const problemContext = {
    title: session.problem.title,
    statement: session.problem.statement,
    pattern: session.problem.pattern,
    difficulty: session.problem.difficulty,
  };

  const {
    messages,
    sendChat,
    isLoading: aiLoading,
    hintStream,
    getHint,
    explanationStream,
    getExplanation,
    askAboutFailure,
  } = useAIChat({
    mode: session.mode ?? 'SELF_PRACTICE',
    problem: problemContext,
    currentCode: code,
    testResults: testRunResults
      ? { passed: testRunResults.passed, total: testRunResults.total }
      : undefined,
  });

  const handleCodeChange = useCallback(
    async (newCode: string) => {
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
    },
    [sessionId],
  );

  const handleHintRequest = useCallback(
    async (level: number) => {
      setHintLevel(level);
      const hintContent = await getHint(level);
      if (hintContent) {
        await fetch(`/api/sessions/${sessionId}/hints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level, content: hintContent }),
        });
      }
    },
    [getHint, sessionId],
  );

  const handleRunTests = useCallback(async () => {
    workspaceRef.current?.openTestResults();

    if (!pyodideReady) {
      setPyodideLoading(true);
      setPyodideReady(true);
    }

    const testCases = session.problem.testCases.map((tc) => ({
      input: tc.input,
      expected: tc.expected,
      isHidden: tc.isHidden,
    }));
    await runTests(code, testCases);
    setPyodideLoading(false);
    setShowFailureButton(true);

    // Save test run results
    if (testRunResults) {
      try {
        await fetch('/api/runs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            code,
            results: testRunResults.results,
            passed: testRunResults.passed,
            total: testRunResults.total,
          }),
        });
      } catch {
        // Non-critical
      }
    }
  }, [session, code, runTests, sessionId, testRunResults, pyodideReady]);

  const handleAskAboutFailure = useCallback(
    (failedSummary: string) => {
      workspaceRef.current?.openCoach();
      askAboutFailure(failedSummary);
    },
    [askAboutFailure],
  );

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

  if (error) {
    return (
      <div className="flex h-[calc(100vh-57px)] items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg text-[var(--color-error)]">{error}</p>
          <Link href="/practice" className="text-sm text-[var(--color-accent)] hover:underline">
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  const isMac = typeof window !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  const examples = (session.problem.examples ?? []) as Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;

  const displayResults = testRunResults
    ? testRunResults.results.map((r) => ({ ...r, isHidden: r.input === '' && r.expected === '' }))
    : session.runs.length > 0
      ? (session.runs[0].results as Array<{
          input: string;
          expected: string;
          actual: string;
          passed: boolean;
          error?: string;
          isHidden: boolean;
        }>)
      : [];

  const passedCount = testRunResults?.passed ?? session.runs[0]?.passed ?? 0;
  const totalCount = testRunResults?.total ?? session.runs[0]?.total ?? 0;
  const hasFailures = showFailureButton && passedCount < totalCount;

  const problemPanel = useMemo(
    () => (
      <ProblemPanel
        problem={{
          title: session.problem.title,
          statement: session.problem.statement,
          examples,
          constraints: session.problem.constraints,
          pattern: session.problem.pattern,
          difficulty: session.problem.difficulty,
        }}
        notes={notes}
        onNotesChange={setNotes}
        mode={session.mode}
        explanationStream={explanationStream}
        getExplanation={getExplanation}
      />
    ),
    [session, examples, notes, explanationStream, getExplanation],
  );

  const editorPanel = useMemo(
    () => (
      <div className="flex h-full flex-col">
        <div className="flex-1 min-h-0">
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            onFocus={() => {}}
            onBlur={() => {}}
          />
        </div>
      </div>
    ),
    [code, handleCodeChange],
  );

  const testResultsPanel = useMemo(
    () => (
      <TestResults
        results={displayResults}
        passedCount={passedCount}
        totalCount={totalCount}
        onAskAboutFailure={hasFailures ? handleAskAboutFailure : undefined}
      />
    ),
    [displayResults, passedCount, totalCount, hasFailures, handleAskAboutFailure],
  );

  const coachingPanel = useMemo(
    () => (
      <CoachingPanel
        mode={session.mode}
        messages={messages}
        onSendMessage={sendChat}
        isLoading={aiLoading || hintStream.isLoading}
        hintStream={hintStream}
        onHintRequest={handleHintRequest}
        hintLevel={hintLevel}
        onAskAboutFailure={hasFailures ? () => handleAskAboutFailure('') : undefined}
        showFailureButton={hasFailures}
      />
    ),
    [
      session.mode,
      messages,
      sendChat,
      aiLoading,
      hintStream,
      handleHintRequest,
      hintLevel,
      hasFailures,
      handleAskAboutFailure,
    ],
  );

  return (
    <div className="flex h-[calc(100vh-57px)] flex-col">
      <AIBanner />
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 md:px-4 md:py-2">
        <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[40%] md:max-w-none">
          {session.problem.title}
        </span>
        <div className="flex items-center gap-2 md:gap-3">
          <div className="hidden items-center md:flex">
            <button
              onClick={handleRunTests}
              disabled={isRunning}
              className="rounded-lg bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-[var(--color-bg-primary)] transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {isRunning ? 'Running...' : 'Run Tests'}
            </button>
          </div>

          {pyodideLoading && (
            <span className="hidden lg:flex items-center gap-2 text-[10px] text-[var(--color-text-muted)] animate-pulse">
              <span className="inline-block h-2 w-2 animate-spin rounded-full border border-[var(--color-accent)] border-t-transparent" />
              Preparing...
            </span>
          )}

          <div className="h-4 w-px bg-[var(--color-border)] hidden md:block" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleEndSession}
            disabled={completing}
            aria-label="End current session"
            className="h-8 px-2 text-[var(--color-error)] hover:bg-[var(--color-error)]/10 md:px-3"
          >
            {completing ? 'Ending...' : 'End Session'}
          </Button>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ErrorBoundary>
          <SessionLayout
            workspaceRef={workspaceRef}
            onRunTests={handleRunTests}
            isRunning={isRunning || pyodideLoading}
            problem={problemPanel}
            editor={editorPanel}
            testResults={testResultsPanel}
            coach={coachingPanel}
            testResultsData={
              testRunResults
                ? { passed: testRunResults.passed, total: testRunResults.total }
                : undefined
            }
            problemTitle={session.problem.title}
            constraints={session.problem.constraints}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
