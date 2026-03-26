'use client';

import { cn } from '@/lib/utils';

interface TestResult {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  error?: string;
  isHidden: boolean;
}

interface TestResultsProps {
  results: TestResult[];
  passedCount: number;
  totalCount: number;
}

export function TestResults({ results, passedCount, totalCount }: TestResultsProps) {
  const visibleResults = results.filter((r) => !r.isHidden);
  const hiddenResults = results.filter((r) => r.isHidden);
  const hiddenPassed = hiddenResults.filter((r) => r.passed).length;

  return (
    <div className="flex h-full flex-col">
      {/* Summary bar */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-2">
        <span
          className={cn(
            'text-sm font-medium',
            passedCount === totalCount
              ? 'text-[var(--color-success)]'
              : 'text-[var(--color-text-secondary)]',
          )}
        >
          {passedCount}/{totalCount} tests passed
        </span>
        {passedCount < totalCount && (
          <button
            disabled
            className="text-xs text-[var(--color-text-muted)] underline decoration-dotted"
          >
            Why did this fail?
          </button>
        )}
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto">
        {visibleResults.length === 0 && hiddenResults.length === 0 && (
          <div className="flex h-full items-center justify-center text-sm text-[var(--color-text-muted)]">
            Run your code to see test results
          </div>
        )}

        {visibleResults.map((result, i) => (
          <div key={i} className="border-b border-[var(--color-border-subtle)] px-4 py-3">
            <div className="mb-2 flex items-center gap-2">
              {result.passed ? (
                <span className="text-[var(--color-success)]">✓</span>
              ) : (
                <span className="text-[var(--color-error)]">✗</span>
              )}
              <span className="text-xs font-medium text-[var(--color-text-muted)]">
                Test {i + 1}
              </span>
            </div>

            <div className="space-y-1 font-[family-name:var(--font-jetbrains-mono)] text-xs">
              <div>
                <span className="text-[var(--color-text-muted)]">Input: </span>
                <span className="text-[var(--color-text-primary)]">{result.input}</span>
              </div>
              <div>
                <span className="text-[var(--color-text-muted)]">Expected: </span>
                <span className="text-[var(--color-success)]">{result.expected}</span>
              </div>
              {!result.passed && !result.error && (
                <div>
                  <span className="text-[var(--color-text-muted)]">Actual: </span>
                  <span className="text-[var(--color-error)]">{result.actual}</span>
                </div>
              )}
              {result.error && (
                <div>
                  <span className="text-[var(--color-text-muted)]">Error: </span>
                  <span className="text-[var(--color-error)]">{result.error}</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {hiddenResults.length > 0 && (
          <div className="border-b border-[var(--color-border-subtle)] px-4 py-3">
            <div className="flex items-center gap-2">
              {hiddenPassed === hiddenResults.length ? (
                <span className="text-[var(--color-success)]">✓</span>
              ) : (
                <span className="text-[var(--color-warning)]">⚠</span>
              )}
              <span className="text-sm text-[var(--color-text-secondary)]">
                {hiddenPassed}/{hiddenResults.length} hidden tests passed
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TestResults;
