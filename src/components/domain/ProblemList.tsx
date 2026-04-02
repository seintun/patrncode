'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import type { Difficulty, Pattern, MasteryState } from '@/generated/prisma/enums';
import { DailyChallengeBanner } from '@/components/domain/DailyChallengeBanner';

interface ProblemItem {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  pattern: Pattern;
  leetcodeNumber?: number | null;
  testCaseCount: number;
  mastery: MasteryState | null;
  sessionStatus: 'ACTIVE' | 'ABANDONED' | null;
}

interface DailyChallenge {
  id: string;
  title: string;
  slug: string;
  difficulty: Difficulty;
  pattern: Pattern;
}

const PATTERN_OPTIONS = [
  { value: '', label: 'All Patterns' },
  { value: 'ARRAYS_STRINGS', label: 'Arrays & Strings' },
  { value: 'HASH_MAPS', label: 'Hash Maps' },
  { value: 'TWO_POINTERS', label: 'Two Pointers' },
  { value: 'SLIDING_WINDOW', label: 'Sliding Window' },
  { value: 'BINARY_SEARCH', label: 'Binary Search' },
  { value: 'LINKED_LISTS', label: 'Linked Lists' },
  { value: 'STACKS_QUEUES', label: 'Stacks & Queues' },
  { value: 'TREES', label: 'Trees' },
  { value: 'GRAPHS', label: 'Graphs' },
  { value: 'RECURSION_BACKTRACKING', label: 'Recursion & Backtracking' },
  { value: 'DYNAMIC_PROGRAMMING', label: 'Dynamic Programming' },
  { value: 'HEAPS', label: 'Heaps' },
  { value: 'SORTING', label: 'Sorting' },
  { value: 'GREEDY', label: 'Greedy' },
  { value: 'TRIES', label: 'Tries' },
  { value: 'BIT_MANIPULATION', label: 'Bit Manipulation' },
  { value: 'INTERVALS', label: 'Intervals' },
  { value: 'ADVANCED_GRAPHS', label: 'Advanced Graphs' },
  { value: 'MATH_GEOMETRY', label: 'Math & Geometry' },
  { value: 'PREFIX_SUM', label: 'Prefix Sum' },
];

const DIFFICULTIES: Difficulty[] = ['EASY', 'MEDIUM', 'HARD'];

const SORT_OPTIONS = [
  { value: 'difficulty', label: 'Difficulty' },
  { value: 'pattern', label: 'Pattern' },
  { value: 'title', label: 'Title' },
];

const CURATION_OPTIONS = [
  { value: 'all', label: 'All Problems' },
  { value: 'curated', label: 'NeetCode Set' },
];

function formatPattern(pattern: Pattern): string {
  return pattern
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c: string) => c.toUpperCase());
}

function difficultySortOrder(d: Difficulty): number {
  if (d === 'EASY') return 0;
  if (d === 'MEDIUM') return 1;
  return 2;
}

export default function ProblemList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const didSyncFromUrlRef = useRef(false);
  const latestProblemRequestIdRef = useRef(0);
  const [problems, setProblems] = useState<ProblemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [pattern, setPattern] = useState(() => searchParams.get('pattern') ?? '');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | ''>(() => {
    const urlDifficulty = searchParams.get('difficulty');
    return urlDifficulty === 'EASY' || urlDifficulty === 'MEDIUM' || urlDifficulty === 'HARD'
      ? urlDifficulty
      : '';
  });
  const [sortBy, setSortBy] = useState('difficulty');
  const [curationFilter, setCurationFilter] = useState<'all' | 'curated'>('all');
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [refreshNonce, setRefreshNonce] = useState(0);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [search]);

  const fetchProblems = useCallback(
    async (signal: AbortSignal) => {
      const requestId = ++latestProblemRequestIdRef.current;
      setLoading(true);
      setError('');

      try {
        const params = new URLSearchParams();
        if (pattern) params.set('pattern', pattern);
        if (difficultyFilter) params.set('difficulty', difficultyFilter);
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (curationFilter === 'curated') params.set('curated', 'true');

        const res = await fetch(`/api/problems?${params.toString()}`, {
          cache: 'no-store',
          signal,
        });
        if (!res.ok) throw new Error('Failed to fetch problems');

        const data: ProblemItem[] = await res.json();
        if (signal.aborted || requestId !== latestProblemRequestIdRef.current) {
          return;
        }
        setProblems(data);
      } catch (err) {
        if (
          (err as Error).name === 'AbortError' ||
          signal.aborted ||
          requestId !== latestProblemRequestIdRef.current
        ) {
          return;
        }
        setError('Failed to load problems. Please try again.');
      } finally {
        if (!signal.aborted && requestId === latestProblemRequestIdRef.current) {
          setLoading(false);
        }
      }
    },
    [pattern, difficultyFilter, debouncedSearch, curationFilter],
  );

  useEffect(() => {
    const controller = new AbortController();
    void fetchProblems(controller.signal);

    return () => {
      controller.abort();
    };
  }, [fetchProblems, refreshNonce]);

  useEffect(() => {
    const urlPattern = searchParams.get('pattern') ?? '';
    const urlDifficulty = searchParams.get('difficulty');
    const urlSearch = searchParams.get('search') ?? '';
    const normalizedDifficulty: Difficulty | '' =
      urlDifficulty === 'EASY' || urlDifficulty === 'MEDIUM' || urlDifficulty === 'HARD'
        ? urlDifficulty
        : '';

    setPattern((prev) => (prev === urlPattern ? prev : urlPattern));
    setDifficultyFilter((prev) => (prev === normalizedDifficulty ? prev : normalizedDifficulty));
    setSearch((prev) => (prev === urlSearch ? prev : urlSearch));
    setDebouncedSearch((prev) => (prev === urlSearch ? prev : urlSearch));

    didSyncFromUrlRef.current = true;
  }, [searchParams]);

  useEffect(() => {
    if (!didSyncFromUrlRef.current) return;

    const next = new URLSearchParams(searchParams.toString());

    if (pattern) next.set('pattern', pattern);
    else next.delete('pattern');

    if (difficultyFilter) next.set('difficulty', difficultyFilter);
    else next.delete('difficulty');

    if (debouncedSearch) next.set('search', debouncedSearch);
    else next.delete('search');

    const nextQuery = next.toString();
    const currentQuery = searchParams.toString();
    if (nextQuery !== currentQuery) {
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
    }
  }, [debouncedSearch, difficultyFilter, pathname, pattern, router, searchParams]);

  useEffect(() => {
    fetch('/api/daily-challenge')
      .then((r) => r.json())
      .then((data: { dailyChallenge: DailyChallenge | null }) =>
        setDailyChallenge(data.dailyChallenge ?? null),
      )
      .catch(() => {});
  }, []);

  const sorted = useMemo(() => {
    const copy = [...problems];
    if (sortBy === 'difficulty') {
      copy.sort((a, b) => difficultySortOrder(a.difficulty) - difficultySortOrder(b.difficulty));
    } else if (sortBy === 'pattern') {
      copy.sort((a, b) => a.pattern.localeCompare(b.pattern));
    } else {
      copy.sort((a, b) => a.title.localeCompare(b.title));
    }
    return copy;
  }, [problems, sortBy]);

  const dailyMastery = dailyChallenge
    ? (problems.find((p) => p.slug === dailyChallenge.slug)?.mastery ?? null)
    : null;
  const alreadySolved = dailyMastery === 'MASTERED' || dailyMastery === 'NEEDS_REFRESH';

  return (
    <div className="mx-auto max-w-4xl px-4 py-5 sm:py-8">
      {dailyChallenge && (
        <DailyChallengeBanner dailyChallenge={dailyChallenge} alreadySolved={alreadySolved} />
      )}
      <h1 className="mb-4 text-2xl font-bold text-[var(--color-text-primary)] sm:mb-6">
        Practice Problems
      </h1>

      <div className="mb-4 space-y-2 sm:mb-6 sm:flex sm:flex-wrap sm:items-center sm:gap-3 sm:space-y-0">
        <div className="min-w-0 sm:min-w-[200px] sm:flex-1">
          <label htmlFor="problem-search" className="sr-only">
            Search problems
          </label>
          <Input
            id="problem-search"
            type="search"
            placeholder="Search problems..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search problems"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-3">
          <label htmlFor="pattern-filter" className="sr-only">
            Filter by pattern
          </label>
          <Select
            id="pattern-filter"
            options={PATTERN_OPTIONS}
            value={pattern}
            onChange={(v) => setPattern(v)}
            className="w-full sm:w-44"
            aria-label="Filter by pattern"
          />
          <label htmlFor="sort-select" className="sr-only">
            Sort problems
          </label>
          <Select
            id="sort-select"
            options={SORT_OPTIONS}
            value={sortBy}
            onChange={setSortBy}
            className="w-full sm:w-36"
            aria-label="Sort problems"
          />
          <label htmlFor="curation-select" className="sr-only">
            Filter by curation
          </label>
          <Select
            id="curation-select"
            options={CURATION_OPTIONS}
            value={curationFilter}
            onChange={(v) => setCurationFilter(v as 'all' | 'curated')}
            className="col-span-2 w-full sm:col-span-1 sm:w-40"
            aria-label="Filter by curation"
          />
        </div>
      </div>

      <div
        className="mb-4 flex flex-wrap gap-2 sm:mb-6"
        role="radiogroup"
        aria-label="Filter by difficulty"
        onKeyDown={(e) => {
          const currentIndex = DIFFICULTIES.indexOf(difficultyFilter as Difficulty);
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
            e.preventDefault();
            const next = currentIndex < DIFFICULTIES.length - 1 ? currentIndex + 1 : 0;
            setDifficultyFilter(DIFFICULTIES[next]);
          } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
            e.preventDefault();
            const prev = currentIndex > 0 ? currentIndex - 1 : DIFFICULTIES.length - 1;
            setDifficultyFilter(DIFFICULTIES[prev]);
          }
        }}
      >
        {DIFFICULTIES.map((d) => (
          <button
            key={d}
            role="radio"
            onClick={() => setDifficultyFilter(difficultyFilter === d ? '' : d)}
            aria-checked={difficultyFilter === d}
            aria-label={`Filter by ${d.toLowerCase()} difficulty`}
            className="min-h-10 cursor-pointer rounded-full transition-opacity"
            style={{ opacity: difficultyFilter === d || !difficultyFilter ? 1 : 0.4 }}
          >
            <Badge
              variant="difficulty"
              value={d === 'HARD' ? 'HARD' : d === 'MEDIUM' ? 'MEDIUM' : 'EASY'}
            />
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <div className="text-center">
          <p className="mb-3 text-[var(--color-error)]">{error}</p>
          <Button variant="secondary" onClick={() => setRefreshNonce((n) => n + 1)}>
            Retry
          </Button>
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="mb-4 text-[var(--color-text-muted)]">No problems match your filters.</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setSearch('');
              setPattern('');
              setDifficultyFilter('');
            }}
          >
            Clear filters
          </Button>
        </div>
      ) : (
        <div className="space-y-1.5 sm:space-y-2">
          {sorted.map((problem) => (
            <Link key={problem.id} href={`/practice/${problem.slug}`} className="block">
              <Card className="flex flex-col items-start gap-2 p-3 transition-colors hover:bg-[var(--color-bg-elevated)] sm:flex-row sm:items-center sm:gap-4 sm:p-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-words text-base font-medium leading-snug text-[var(--color-text-primary)] sm:truncate">
                      {problem.title}
                    </p>
                    {problem.leetcodeNumber ? (
                      <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-0.5 text-[10px] font-semibold text-[var(--color-text-secondary)]">
                        LC #{problem.leetcodeNumber}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-xs text-[var(--color-text-muted)] sm:text-sm">
                    {problem.testCaseCount} test cases
                  </p>
                </div>
                <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:shrink-0 sm:flex-nowrap">
                  <Badge variant="pattern" value={formatPattern(problem.pattern)} />
                  <Badge
                    variant="difficulty"
                    value={
                      problem.difficulty === 'HARD'
                        ? 'HARD'
                        : problem.difficulty === 'MEDIUM'
                          ? 'MEDIUM'
                          : 'EASY'
                    }
                  />
                  {problem.sessionStatus === 'ACTIVE' ? (
                    <Badge variant="mastery" value="IN_PROGRESS" />
                  ) : problem.sessionStatus === 'ABANDONED' ? (
                    <Badge variant="mastery" value="ABANDONED" />
                  ) : (
                    problem.mastery && <Badge variant="mastery" value={problem.mastery} />
                  )}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
