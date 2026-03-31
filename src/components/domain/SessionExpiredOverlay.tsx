'use client';

import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { SessionMode } from '@/lib/sophia';
import { SOPHIA_MODES } from '@/lib/sophia';

interface SessionExpiredOverlayProps {
  mode: SessionMode;
  problemTitle?: string;
  onViewSummary: () => void;
  onReturnToPractice: () => void;
}

export function SessionExpiredOverlay({
  mode,
  problemTitle,
  onViewSummary,
  onReturnToPractice,
}: SessionExpiredOverlayProps) {
  const sophiaConfig = SOPHIA_MODES[mode];

  return (
    <div className="absolute inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg-primary)]/60 backdrop-blur-md animate-in fade-in duration-500">
      <Card className="max-w-md border-[var(--color-error)]/30 bg-[var(--color-bg-elevated)]/90 p-8 shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="mb-6 flex justify-center">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-error)]/10 text-[var(--color-error)] border border-[var(--color-error)]/20 shadow-inner"
            style={
              {
                animation: 'glow 2s ease-in-out infinite',
                '--sophia-glow-color': 'rgba(239, 68, 68, 0.3)',
              } as React.CSSProperties
            }
          >
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
              <path d="m15 19-3-3-3 3" />
            </svg>
          </div>
        </div>

        <h2 className="mb-2 text-center text-2xl font-bold text-[var(--color-text-primary)]">
          Session Expired
        </h2>
        <p className="mb-8 text-center text-sm text-[var(--color-text-secondary)] leading-relaxed">
          Time is up for your{' '}
          <span style={{ color: sophiaConfig.colors.text }} className="font-semibold">
            {mode.replace('_', ' ')}
          </span>{' '}
          session on{' '}
          <span className="font-medium text-[var(--color-text-primary)]">
            {problemTitle || 'this problem'}
          </span>
          .
        </p>

        <div className="flex flex-col gap-3">
          <Button onClick={onViewSummary} className="w-full" size="lg">
            View Final Summary
          </Button>
          <Button
            variant="secondary"
            onClick={onReturnToPractice}
            className="w-full bg-transparent border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
            size="lg"
          >
            Return to Practice
          </Button>
        </div>
      </Card>
    </div>
  );
}
