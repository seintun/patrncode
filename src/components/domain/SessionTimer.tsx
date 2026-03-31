'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface SessionTimerProps {
  startTime: string | Date;
  expiresAt?: string | Date | null;
  onExtend?: () => void;
  className?: string;
}

export function SessionTimer({ startTime, expiresAt, onExtend, className }: SessionTimerProps) {
  const [elapsed, setElapsed] = useState(0);
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const start = new Date(startTime).getTime();
    const expiry = expiresAt ? new Date(expiresAt).getTime() : null;

    const updateTimes = () => {
      const now = Date.now();
      setElapsed(Math.max(0, Math.floor((now - start) / 1000)));
      if (expiry) {
        setRemaining(Math.max(0, Math.floor((expiry - now) / 1000)));
      } else {
        setRemaining(null);
      }
    };

    updateTimes();
    const interval = setInterval(updateTimes, 1000);

    return () => clearInterval(interval);
  }, [startTime, expiresAt]);

  const displayTime = remaining !== null ? remaining : elapsed;
  const hours = Math.floor(displayTime / 3600);
  const minutes = Math.floor((displayTime % 3600) / 60);
  const seconds = displayTime % 60;

  const isLowTime = remaining !== null && remaining < 300; // < 5 minutes
  const isWarningTime = remaining !== null && remaining < 900; // < 15 minutes
  const isExpired = remaining !== null && remaining === 0;

  const pad = (n: number) => n.toString().padStart(2, '0');

  return (
    <div className={cn('flex items-center gap-2', isLowTime && 'animate-pulse-subtle')}>
      <div
        className={cn(
          'flex items-center gap-1.5 font-mono text-[11px] md:text-xs font-bold tracking-tight border px-2.5 py-1 rounded-full shadow-lg transition-all duration-500',
          isLowTime
            ? 'animate-glow bg-[var(--color-error)]/10 border-[var(--color-error)]/50 text-[var(--color-error)] ring-1 ring-[var(--color-error)]/20'
            : isWarningTime
              ? 'animate-glow bg-[var(--color-warning)]/10 border-[var(--color-warning)]/40 text-[var(--color-warning)]'
              : 'bg-[var(--color-bg-elevated)] border-[var(--color-border)]',
          className,
        )}
        style={
          isLowTime
            ? ({ '--sophia-glow-color': 'rgba(239, 68, 68, 0.6)' } as React.CSSProperties)
            : isWarningTime
              ? ({ '--sophia-glow-color': 'rgba(245, 158, 11, 0.4)' } as React.CSSProperties)
              : {}
        }
        title={remaining !== null ? 'Session Time Remaining' : 'Session Duration'}
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
          className={cn(
            isLowTime
              ? 'text-[var(--color-error)]'
              : isWarningTime
                ? 'text-[var(--color-warning)]'
                : 'text-[var(--color-text-muted)]',
          )}
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <div className="flex items-center tabular-nums">
          {hours > 0 && (
            <>
              <span>{pad(hours)}</span>
              <span className="mx-0.5 opacity-50">:</span>
            </>
          )}
          <span>{pad(minutes)}</span>
          <span className="mx-0.5 opacity-50">:</span>
          <span className={cn(remaining === null ? 'text-[var(--color-accent)]' : '')}>
            {pad(seconds)}
          </span>
        </div>
      </div>

      {isLowTime && !isExpired && onExtend && (
        <button
          onClick={onExtend}
          className="rounded-full bg-[var(--color-accent)]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent)] transition-colors hover:bg-[var(--color-accent)]/20"
        >
          Extend +15m
        </button>
      )}

      {isExpired && (
        <span className="text-[10px] font-bold uppercase text-[var(--color-error)]">Expired</span>
      )}
    </div>
  );
}
