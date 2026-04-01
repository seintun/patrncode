'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';
import { getSophiaConfig, SOPHIA_AVATAR } from '@/lib/sophia';
import type { SessionMode } from '@/generated/prisma/enums';

interface SummaryData {
  id: string;
  problemId: string;
  problem: {
    title: string;
    slug: string;
    pattern: string;
    difficulty: string;
  };
  mode: SessionMode;
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
  const [feedbackTimeout, setFeedbackTimeout] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const config = useMemo(() => {
    const mode = data?.mode ?? ('COACH_ME' as SessionMode);
    return getSophiaConfig(mode);
  }, [data?.mode]);

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

  useEffect(() => {
    // Only poll when session data is loaded, feedback is still null, and not timed out
    if (!data || data.feedback !== null || feedbackTimeout) {
      return;
    }

    let isMounted = true;
    let attempts = 0;
    const maxAttempts = 10; // 15s total (1.5s interval)

    const interval = setInterval(async () => {
      attempts++;

      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (res.ok && isMounted) {
          const updated = await res.json();
          if (updated.feedback && isMounted) {
            setData(updated);
            clearInterval(interval);
            return;
          }
        }
      } catch {
        // silent retry
      }

      if (attempts >= maxAttempts && isMounted) {
        clearInterval(interval);
        setFeedbackTimeout(true);
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [data, sessionId, feedbackTimeout]);

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

  const latestRun = data.runs[0];
  const passed = latestRun?.passed ?? 0;
  const total = latestRun?.total ?? 0;
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;

  const startTime = new Date(data.startedAt).getTime();
  const endTime = data.completedAt ? new Date(data.completedAt).getTime() : Date.now();
  const timeSpentSeconds = Math.floor((endTime - startTime) / 1000);
  const timeMinutes = Math.round(timeSpentSeconds / 60);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 animate-in fade-in slide-in-from-bottom-6 duration-1000">
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-ai-coach)] rounded-lg blur opacity-15 group-hover:opacity-20 transition duration-1000"></div>
          <div className="relative">
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-text-primary)] to-[var(--color-text-secondary)]">
              Session Complete
            </h1>
            <p className="mt-2 text-base text-[var(--color-text-secondary)] font-medium flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-[var(--color-accent)] animate-pulse" />
              {data.problem.title}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-auto">
          <Badge
            variant="pattern"
            value={data.problem.pattern.replace(/_/g, ' ')}
            className="px-3 py-1 text-xs font-semibold backdrop-blur-md bg-white/5 border-white/10"
          />
          {data.outcome && (
            <Badge
              variant="difficulty"
              value={outcomeBadgeLevel[data.outcome]}
              className="px-3 py-1 text-xs font-semibold backdrop-blur-md bg-white/5 border-white/10"
            />
          )}
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Card className="relative overflow-hidden group text-center py-6 backdrop-blur-xl bg-[var(--color-bg-secondary)]/60 border-white/10 shadow-2xl hover:border-[var(--color-accent)]/30 transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)]/20 to-transparent" />
          <p className="text-3xl font-bold text-[var(--color-accent)] mb-1 drop-shadow-sm">
            {timeMinutes}m
          </p>
          <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-[var(--color-text-muted)]">
            Time Spent
          </p>
        </Card>
        <Card className="relative overflow-hidden group text-center py-6 backdrop-blur-xl bg-[var(--color-bg-secondary)]/60 border-white/10 shadow-2xl hover:border-[var(--color-accent)]/30 transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)]/20 to-transparent" />
          <p className="text-3xl font-bold text-[var(--color-accent)] mb-1 drop-shadow-sm">
            {data.hints.length}
          </p>
          <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-[var(--color-text-muted)]">
            Hints Used
          </p>
        </Card>
        <Card className="relative overflow-hidden group text-center py-6 backdrop-blur-xl bg-[var(--color-bg-secondary)]/60 border-white/10 shadow-2xl hover:border-[var(--color-accent)]/30 transition-all duration-500">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)]/20 to-transparent" />
          <p className="text-3xl font-bold text-[var(--color-accent)] mb-1 drop-shadow-sm">
            {passRate}%
          </p>
          <p className="text-[11px] uppercase tracking-[0.1em] font-bold text-[var(--color-text-muted)]">
            Pass Rate ({passed}/{total})
          </p>
        </Card>
      </div>

      <div className="mb-10">
        <div className="flex items-center gap-4 mb-6 px-1">
          <div className="relative h-10 w-10 shrink-0 p-[2px] rounded-full bg-gradient-to-tr from-[var(--color-ai-coach)] to-[var(--color-accent)] ring-2 ring-transparent group-hover:ring-[var(--color-accent)]/30 transition-all duration-300">
            <div className="relative h-full w-full overflow-hidden rounded-full bg-[var(--color-bg-primary)]">
              {!avatarError ? (
                <Image
                  src={SOPHIA_AVATAR}
                  alt="Sophia"
                  fill
                  sizes="40px"
                  quality={90}
                  style={{ objectFit: 'contain' }}
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-sm font-bold"
                  style={{ backgroundColor: config.colors.primary, color: '#fff' }}
                >
                  S
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-[var(--color-bg-primary)] bg-green-500 animate-pulse" />
          </div>
          <div>
            <h3
              className="text-lg font-bold tracking-tight"
              style={{ color: config.colors.primary }}
            >
              Sophia&apos;s Analysis
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] font-medium">
              Post-session technical insights
            </p>
          </div>
        </div>

        {data.feedback ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card
              className="p-5 border-l-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--color-accent)]/5 group animate-in slide-in-from-bottom-2 fade-in fill-mode-both delay-[100ms] duration-700"
              style={{ borderColor: '#2dd4bf', backgroundColor: 'rgba(45, 212, 191, 0.03)' }}
            >
              <h4 className="text-base font-bold mb-4 text-[var(--color-accent)] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors shadow-inner">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                Strengths
              </h4>
              <div
                className="sophia-prose feedback-list text-[0.9375rem]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <MarkdownRenderer
                  content={data.feedback.strengths}
                  compact={false}
                  accentColor="#2dd4bf"
                />
              </div>
            </Card>

            <Card
              className="p-5 border-l-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-amber-500/5 group animate-in slide-in-from-bottom-2 fade-in fill-mode-both delay-[200ms] duration-700"
              style={{ borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.03)' }}
            >
              <h4 className="text-base font-bold mb-4 text-amber-500 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 group-hover:bg-amber-500/20 transition-colors shadow-inner">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                Areas for Improvement
              </h4>
              <div
                className="sophia-prose feedback-list text-[0.9375rem]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <MarkdownRenderer
                  content={data.feedback.weaknesses}
                  compact={false}
                  accentColor="#f59e0b"
                />
              </div>
            </Card>

            <Card
              className="p-5 border-l-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-indigo-500/5 group animate-in slide-in-from-bottom-2 fade-in fill-mode-both delay-[300ms] duration-700"
              style={{ borderColor: '#818cf8', backgroundColor: 'rgba(129, 140, 248, 0.03)' }}
            >
              <h4 className="text-base font-bold mb-4 text-indigo-400 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 group-hover:bg-indigo-500/20 transition-colors shadow-inner">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                Suggestions
              </h4>
              <div
                className="sophia-prose feedback-list text-[0.9375rem]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <MarkdownRenderer
                  content={data.feedback.suggestions}
                  compact={false}
                  accentColor="#818cf8"
                />
              </div>
            </Card>

            <Card
              className="p-5 border-l-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-[var(--color-accent)]/5 group animate-in slide-in-from-bottom-2 fade-in fill-mode-both delay-[400ms] duration-700"
              style={{ borderColor: '#2dd4bf', backgroundColor: 'rgba(45, 212, 191, 0.03)' }}
            >
              <h4 className="text-base font-bold mb-4 text-[var(--color-accent)] flex items-center gap-3">
                <div className="p-2 rounded-lg bg-teal-500/10 group-hover:bg-teal-500/20 transition-colors shadow-inner">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                Complexity Note
              </h4>
              <div
                className="sophia-prose feedback-list text-[0.9375rem]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <MarkdownRenderer
                  content={data.feedback.complexityNote}
                  compact={false}
                  accentColor="#2dd4bf"
                />
              </div>
            </Card>
          </div>
        ) : feedbackTimeout ? (
          <Card className="p-4">
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                {!avatarError ? (
                  <Image
                    src={SOPHIA_AVATAR}
                    alt="Sophia"
                    fill
                    sizes="20px"
                    quality={90}
                    style={{ objectFit: 'contain' }}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: config.colors.primary, color: '#fff' }}
                  >
                    S
                  </div>
                )}
              </div>
              <span>
                Feedback generation timed out. You can still review your session details and try the
                problem again.
              </span>
            </div>
          </Card>
        ) : (
          <Card className="p-4">
            <div className="flex items-center gap-3 text-sm text-[var(--color-text-secondary)]">
              <div className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full">
                {!avatarError ? (
                  <Image
                    src={SOPHIA_AVATAR}
                    alt="Sophia"
                    fill
                    sizes="20px"
                    quality={90}
                    style={{ objectFit: 'contain' }}
                    onError={() => setAvatarError(true)}
                  />
                ) : (
                  <div
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: config.colors.primary, color: '#fff' }}
                  >
                    S
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: config.colors.primary, borderTopColor: 'transparent' }}
                />
                <span>Preparing your post-attempt analysis...</span>
              </div>
            </div>
          </Card>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8 pb-12">
        <Link href={`/practice/${data.problem.slug}`} className="flex-1">
          <Button variant="primary" className="w-full">
            Practice Again
          </Button>
        </Link>
        <Link href="/practice" className="flex-1">
          <Button variant="secondary" className="w-full">
            Select Next Problem
          </Button>
        </Link>
      </div>
    </div>
  );
}
