'use client';

import { type ReactNode } from 'react';
import { Button } from '@/components/ui/Button';

interface ErrorFallbackProps {
  error: Error;
  onRetry: () => void;
  children?: ReactNode;
}

export function ErrorFallback({ error, onRetry, children }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-lg border border-[var(--color-error)]/30 bg-[var(--color-bg-secondary)] p-6 max-w-2xl">
        <p className="mb-1 text-sm font-medium text-[var(--color-error)]">
          ⚠️ Something went wrong
        </p>
        {children && <p className="mb-4 text-sm text-[var(--color-text-secondary)]">{children}</p>}
        <pre className="mb-4 overflow-auto rounded bg-[var(--color-bg-primary)] p-3 text-xs text-left text-[var(--color-text-muted)]">
          {error.message}
          {error.stack && '\n\n' + error.stack}
        </pre>
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    </div>
  );
}
