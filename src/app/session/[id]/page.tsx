'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { SessionLayout } from '@/components/domain/SessionLayout';
import { ProblemPanel } from '@/components/domain/ProblemPanel';

import { TestResults } from '@/components/domain/TestResults';
import { CoachingPanel } from '@/components/domain/CoachingPanel';
import { SessionTimer } from '@/components/domain/SessionTimer';
import { Skeleton } from '@/components/ui/Skeleton';
import { AIBanner } from '@/components/ui/AIBanner';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { useAIChat } from '@/hooks/useAIChat';
import { useCodeExecution } from '@/hooks/useCodeExecution';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { Button } from '@/components/ui/Button';
import type { SessionMode, MessageRole } from '@/generated/prisma/enums';
import type { MobileWorkspaceHandle } from '@/components/domain/MobileWorkspace';

const CodeEditor = dynamic(
  () => import('@/components/domain/CodeEditor').then((mod) => ({ default: mod.CodeEditor })),
  { ssr: false, loading: () => <Skeleton className="h-full w-full" /> },
);

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
  startedAt: string;
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
  messages: Array<{
    id: string;
    role: MessageRole;
    content: string;
    createdAt: string;
  }>;
  expiresAt?: string | null;
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
      <div className="h-[calc(100dvh-57px)]" aria-busy="true" aria-live="polite">
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
      <div className="flex h-[calc(100dvh-57px)] items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg text-[var(--color-error)]">{error ?? 'Session not found'}</p>
          <Link href="/practice" className="text-sm text-[var(--color-accent)] hover:underline">
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  return <SessionContent session={session} sessionId={sessionId} setSession={setSession} />;
}

function SessionContent({
  session,
  sessionId,
  setSession,
}: {
  session: SessionData;
  sessionId: string;
  setSession: React.Dispatch<React.SetStateAction<SessionData | null>>;
}) {
  const router = useRouter();
  const workspaceRef = useRef<MobileWorkspaceHandle | null>(null);
  const testRunCountRef = useRef(0);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [testRunTick, setTestRunTick] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState(session.code ?? session.problem.starterCode ?? '');
  const [notes, setNotes] = useState('');
  const [hintLevel, setHintLevel] = useState(0);
  const [showFailureButton, setShowFailureButton] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [pyodideReady, setPyodideReady] = useState(false);
  const [pyodideLoading, setPyodideLoading] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [showFiveMinWarning, setShowFiveMinWarning] = useState(false);
  const [hasSeenFiveMinWarning, setHasSeenFiveMinWarning] = useState(false);
  const [autoEndCountdown, setAutoEndCountdown] = useState(60);
  const [showEndConfirmation, setShowEndConfirmation] = useState(false);
  const { run: runTests, results: testRunResults, isRunning, prewarmWorker } = useCodeExecution();

  const handleEndSession = useCallback(async () => {
    if (!isExpired && !showEndConfirmation) {
      setShowEndConfirmation(true);
      return;
    }

    setCompleting(true);
    setShowEndConfirmation(false);
    setShowFiveMinWarning(false);
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
  }, [sessionId, code, router, isExpired, showEndConfirmation]);

  const handleExtendSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extend: true }),
      });
      if (res.ok) {
        const updatedSession = await res.json();
        setSession((prev) => (prev ? { ...prev, expiresAt: updatedSession.expiresAt } : prev));
        setShowFiveMinWarning(false);
      }
    } catch (err) {
      console.error('Failed to extend session:', err);
    }
  }, [sessionId, setSession]);

  useEffect(() => {
    if (!session.expiresAt || completing) return;

    const interval = setInterval(() => {
      const remaining = new Date(session.expiresAt!).getTime() - Date.now();

      // Post-expiration countdown (1 minute)
      if (remaining <= 0) {
        setIsExpired(true);
        setAutoEndCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            handleEndSession();
            return 0;
          }
          return prev - 1;
        });
      } else {
        // 5-minute warning trigger
        const remainingMins = Math.floor(remaining / 1000 / 60);
        const remainingSecs = Math.floor((remaining / 1000) % 60);

        if (remainingMins === 5 && remainingSecs === 0 && !hasSeenFiveMinWarning) {
          setShowFiveMinWarning(true);
          setHasSeenFiveMinWarning(true);
        }

        setIsExpired(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [session.expiresAt, hasSeenFiveMinWarning, completing, handleEndSession]);

  useEffect(() => {
    prewarmWorker();
  }, [prewarmWorker]);

  const functionName = useMemo(() => {
    if (!session?.problem.starterCode) return null;
    const match = session.problem.starterCode.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    return match ? match[1] : null;
  }, [session?.problem.starterCode]);

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
    setMessages,
  } = useAIChat({
    mode: session.mode ?? 'SELF_PRACTICE',
    problem: problemContext,
    currentCode: code,
    testResults: testRunResults
      ? { passed: testRunResults.passed, total: testRunResults.total }
      : undefined,
    sessionId,
  });

  // Sync existing hints and messages from session into chat history on load
  useEffect(() => {
    const allMessages: any[] = [];

    // Process Hints
    if (session.hints && session.hints.length > 0) {
      const maxLevel = Math.max(0, ...session.hints.map((h) => h.level));
      setHintLevel(maxLevel);

      allMessages.push(
        ...session.hints.map((h) => ({
          id: h.id,
          role: 'assistant' as const,
          content: h.content,
          parts: [{ type: 'text', text: h.content }],
          annotations: [{ type: 'hint', level: h.level }],
          createdAt: new Date(h.createdAt),
        })),
      );
    }

    // Process Regular Messages
    if (session.messages && session.messages.length > 0) {
      allMessages.push(
        ...session.messages.map((m) => ({
          id: m.id,
          role: m.role.toLowerCase() as any, // 'user' or 'assistant'
          content: m.content,
          createdAt: new Date(m.createdAt),
        })),
      );
    }

    if (allMessages.length > 0) {
      // Sort chronologically
      allMessages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const newMessages = allMessages.filter((m) => !existingIds.has(m.id));
        return [...prev, ...newMessages];
      });
    }
  }, [session.hints, session.messages, setMessages]);

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
    testRunCountRef.current++;
    setTestRunTick((t) => t + 1);
    // Only open the sheet programmatically on mobile to avoid scroll locking on desktop
    if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
      workspaceRef.current?.openTestResults();
    }

    if (!pyodideReady) {
      setPyodideLoading(true);
      setPyodideReady(true);
    }

    try {
      const testCases = session.problem.testCases.map((tc) => ({
        input: tc.input,
        expected: tc.expected,
        isHidden: tc.isHidden,
      }));
      const result = await runTests(code, testCases, functionName);
      setShowFailureButton(true);

      // Save test run results using the returned result directly
      if (result) {
        try {
          await fetch('/api/runs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId,
              code,
              results: result.results,
              passed: result.passed,
              total: result.total,
            }),
          });
        } catch (saveErr) {
          console.warn('[SessionPage] Failed to persist test run:', saveErr);
        }
      }
    } catch (err) {
      console.error('[SessionPage] handleRunTests failed:', err);
    } finally {
      setPyodideLoading(false);
    }
  }, [session, code, runTests, sessionId, pyodideReady, functionName]);

  useKeyboardShortcuts({
    onRunTests: handleRunTests,
    onGetHint: () => handleHintRequest(Math.min(hintLevel + 1, 3)),
  });

  const handleAskAboutFailure = useCallback(
    (failedSummary: string) => {
      workspaceRef.current?.openCoach();
      askAboutFailure(failedSummary);
    },
    [askAboutFailure],
  );

  const examples = useMemo(
    () =>
      (session.problem.examples ?? []) as Array<{
        input: string;
        output: string;
        explanation?: string;
      }>,
    [session.problem.examples],
  );

  const displayResults = useMemo(
    () =>
      testRunResults
        ? testRunResults.results.map((r) => ({
            ...r,
            isHidden: r.input === '' && r.expected === '',
          }))
        : session.runs.length > 0
          ? (session.runs[0].results as Array<{
              input: string;
              expected: string;
              actual: string;
              passed: boolean;
              error?: string;
              isHidden: boolean;
            }>)
          : [],
    [testRunResults, session.runs],
  );

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
        sessionId={sessionId}
      />
    ),
    [session, examples, notes, explanationStream, getExplanation, sessionId],
  );

  const editorPanel = useMemo(
    () => (
      <div className="flex h-full flex-col">
        <div className="flex-1 min-h-0">
          <CodeEditor
            value={code}
            onChange={handleCodeChange}
            onFocus={() => workspaceRef.current?.focusEditor()}
            onBlur={() => workspaceRef.current?.blurEditor()}
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

  if (error) {
    return (
      <div className="flex h-[calc(100dvh-57px)] items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg text-[var(--color-error)]">{error}</p>
          <Link href="/practice" className="text-sm text-[var(--color-accent)] hover:underline">
            Back to Practice
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100dvh-57px)] flex-col">
      <AIBanner />
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1 md:px-4 md:py-2">
        <div className="flex flex-1 items-center justify-between min-w-0 px-2 md:px-0">
          <span className="text-sm font-medium text-[var(--color-text-primary)] truncate max-w-[140px] sm:max-w-[200px] md:max-w-none">
            {session.problem.title}
          </span>
          <SessionTimer
            startTime={session.startedAt}
            expiresAt={session.expiresAt}
            onExtend={handleExtendSession}
            className="ml-2 shrink-0"
          />
        </div>

        <div className="flex items-center gap-2 md:gap-3 ml-2">
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
      <div className="flex-1 min-h-0 relative">
        {showFiveMinWarning && !isExpired && (
          <div className="absolute inset-0 z-[110] flex items-center justify-center bg-[var(--color-bg-primary)]/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="max-w-md w-full mx-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="mb-2 text-xl font-bold text-[var(--color-text-primary)] leading-tight">
                Time is running low!
              </h2>
              <p className="mb-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                You have <strong>5 minutes left</strong> in this session. Would you like to{' '}
                <strong>extend your session by 15 minutes</strong> to keep working?
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleExtendSession}
                  className="flex-1 bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)]"
                >
                  Extend 15 mins
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowFiveMinWarning(false)}
                  className="flex-1 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                >
                  No thanks
                </Button>
              </div>
            </div>
          </div>
        )}

        {isExpired && (
          <div className="absolute inset-0 z-[120] flex items-center justify-center bg-[var(--color-bg-primary)]/70 backdrop-blur-lg animate-in fade-in duration-500">
            <div className="max-w-md w-full mx-4 rounded-xl border border-[var(--color-error)]/30 bg-[var(--color-bg-elevated)] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="mb-4 flex flex-col items-center text-center">
                <div className="mb-4 rounded-full bg-[var(--color-error)]/10 p-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="text-[var(--color-error)]"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <h2 className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">
                  Session Expired
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Your practice time has concluded. We are preparing your performance analysis.
                </p>
              </div>

              <div className="mb-8 overflow-hidden rounded-lg bg-[var(--color-bg-secondary)] p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-[var(--color-text-muted)]">
                  Auto-completing in
                </p>
                <div className="text-3xl font-mono font-bold text-[var(--color-error)]">
                  00:{autoEndCountdown < 10 ? `0${autoEndCountdown}` : autoEndCountdown}
                </div>
              </div>

              <Button
                onClick={handleEndSession}
                className="w-full bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/80 py-6 text-lg font-bold"
                disabled={completing}
              >
                {completing ? 'Completing...' : 'End Session & Get Feedback'}
              </Button>
            </div>
          </div>
        )}

        {showEndConfirmation && !isExpired && (
          <div
            className="absolute inset-0 z-[110] flex items-center justify-center bg-[var(--color-bg-primary)]/60 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowEndConfirmation(false)}
          >
            <div
              className="max-w-md w-full mx-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-2xl animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="mb-2 text-xl font-bold text-[var(--color-text-primary)] leading-tight">
                Ready to wrap up?
              </h2>
              <p className="mb-6 text-sm text-[var(--color-text-secondary)] leading-relaxed">
                End your session now to let us <strong>analyze your work</strong>. We&apos;ll
                generate a <strong>personalized performance breakdown</strong>, which will be
                available in your progress dashboard shortly.
              </p>
              <div className="flex gap-3">
                <Button
                  onClick={handleEndSession}
                  className="flex-1 bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/80 border-none"
                  disabled={completing}
                >
                  {completing ? 'Preparing...' : 'Yes, End Session'}
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowEndConfirmation(false)}
                  className="flex-1 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
        <ErrorBoundary>
          <SessionLayout
            workspaceRef={workspaceRef}
            onRunTests={handleRunTests}
            isRunning={isRunning || pyodideLoading}
            mode={session.mode ?? 'SELF_PRACTICE'}
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
            codeIsEmpty={code.trim().length === 0}
            codeLength={code.length}
            testRunCount={testRunCountRef.current}
          />
        </ErrorBoundary>
      </div>
    </div>
  );
}
