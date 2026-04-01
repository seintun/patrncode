'use client';

import type { ReactNode } from 'react';
import type { SessionMode } from '@/generated/prisma/enums';
import { SOPHIA_MODES } from '@/lib/sophia';
import { Button } from '@/components/ui/Button';

interface SessionAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}

interface SessionContinuationCardProps {
  mode: SessionMode;
  title: string;
  description: ReactNode;
  timeLabel?: string;
  primaryAction: SessionAction;
  secondaryAction?: SessionAction;
}

export function SessionContinuationCard({
  mode,
  title,
  description,
  timeLabel,
  primaryAction,
  secondaryAction,
}: SessionContinuationCardProps) {
  const sophiaConfig = SOPHIA_MODES[mode];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8" style={{ animation: 'scaleIn 0.4s ease-out' }}>
      <div className="mb-8 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 h-24 w-24 overflow-hidden rounded-full border-2 border-[var(--color-accent)] shadow-lg">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sophiaConfig.sceneImage} alt={mode} className="h-full w-full object-cover" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-[var(--color-text-primary)]">{title}</h2>
        <div className="mb-6 flex flex-col items-center gap-1">
          <p className="text-[var(--color-text-secondary)]">{description}</p>
          {timeLabel && (
            <p className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-3 py-1 text-sm font-medium font-mono text-[var(--color-text-muted)]">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[var(--color-accent)]" />
              {timeLabel}
            </p>
          )}
        </div>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Button
            onClick={primaryAction.onClick}
            size="lg"
            disabled={primaryAction.disabled}
            className="min-w-[220px]"
            style={{
              backgroundColor: sophiaConfig.colors.primary,
              boxShadow: `0 8px 30px -4px ${sophiaConfig.colors.primary}44`,
            }}
          >
            {primaryAction.label}
          </Button>

          {secondaryAction && (
            <Button
              variant="secondary"
              onClick={secondaryAction.onClick}
              size="lg"
              disabled={secondaryAction.disabled}
              className={
                secondaryAction.destructive
                  ? 'border-[var(--color-error)] bg-transparent text-[var(--color-error)] hover:bg-[var(--color-error)] hover:text-white'
                  : ''
              }
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
