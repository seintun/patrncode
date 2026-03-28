'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SessionTimerProps {
  startTime: string | Date;
  className?: string;
}

export function SessionTimer({ startTime, className }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startTime).getTime();

    const updateElapsed = () => {
      const now = Date.now();
      setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
    };

    updateElapsed();
    const interval = setInterval(updateElapsed, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 font-mono text-[11px] md:text-xs font-medium tracking-tight bg-[var(--color-bg-elevated)] border border-[var(--color-border)] px-2 py-1 rounded-full shadow-sm',
        className,
      )}
      title="Session Duration"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-[var(--color-text-muted)]"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <div className="flex items-center tabular-nums">
        <span className="text-[var(--color-text-secondary)]">{pad(hours)}</span>
        <span className="mx-0.5 text-[var(--color-text-muted)] opacity-50">:</span>
        <span className="text-[var(--color-text-secondary)]">{pad(minutes)}</span>
        <span className="mx-0.5 text-[var(--color-text-muted)] opacity-50">:</span>
        <span className="text-[var(--color-accent)]">{pad(seconds)}</span>
      </div>
    </div>
  );
}
