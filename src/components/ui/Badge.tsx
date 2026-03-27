'use client';

import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const styles: Record<string, string> = {
  EASY: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  MEDIUM: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
  HARD: 'bg-[var(--color-error)]/20 text-[var(--color-error)]',
  UNSEEN: 'bg-[var(--color-bg-elevated)] text-[var(--color-text-muted)]',
  IN_PROGRESS: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
  MASTERED: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  NEEDS_REFRESH: 'bg-[var(--color-error)]/20 text-[var(--color-error)]',
  SOLVED: 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
  PARTIALLY_SOLVED: 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
  NOT_SOLVED: 'bg-[var(--color-error)]/20 text-[var(--color-error)]',
  PATTERN: 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]',
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: 'difficulty' | 'pattern' | 'mastery' | 'outcome';
  value: string;
  children?: React.ReactNode;
}

export function Badge({ variant, value, className, children, ...rest }: BadgeProps) {
  let styleKey = value;

  if (variant === 'pattern') {
    styleKey = 'PATTERN';
  }

  const style = styles[styleKey] || styles.PATTERN;
  const label = children || value.replace(/_/g, ' ');

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap max-w-[180px] truncate',
        style,
        className,
      )}
      {...rest}
    >
      {label}
    </span>
  );
}

export default Badge;
