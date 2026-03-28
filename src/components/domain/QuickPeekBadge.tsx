'use client';

import { useState, type FC } from 'react';
import { cn } from '@/lib/utils';
import { BottomSheet } from './BottomSheet';

// ── Types ────────────────────────────────────────────────────────────────────

interface QuickPeekBadgeProps {
  problemTitle: string;
  constraints: string[];
  className?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

export const QuickPeekBadge: FC<QuickPeekBadgeProps> = ({
  problemTitle,
  constraints,
  className,
}) => {
  const [open, setOpen] = useState(false);

  const visibleConstraints = constraints.slice(0, 5);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Peek problem info"
        className={cn(
          'quick-peek-badge',
          'fixed top-4 right-4 z-50',
          'flex h-9 items-center gap-1.5 rounded-full px-3',
          'bg-[var(--color-bg-elevated)] border border-[var(--color-border)]',
          'text-sm font-medium text-[var(--color-text-primary)]',
          'shadow-md hover:shadow-lg',
          'transition-shadow duration-200',
          'cursor-pointer select-none',
          className,
        )}
      >
        <span aria-hidden="true" className="text-base leading-none">
          ℹ
        </span>
        <span className="hidden sm:inline">Peek</span>
      </button>

      <BottomSheet
        open={open}
        height="peek"
        zIndex={55}
        onClose={() => setOpen(false)}
        dragHandle={false}
      >
        <div className="flex flex-col gap-4 p-5">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{problemTitle}</h2>

          {visibleConstraints.length > 0 && (
            <ul className="flex flex-col gap-2">
              {visibleConstraints.map((c, i) => (
                <li
                  key={i}
                  className="text-sm text-[var(--color-text-secondary)] line-clamp-2 before:content-['•_']"
                >
                  {c}
                </li>
              ))}
            </ul>
          )}
        </div>
      </BottomSheet>
    </>
  );
};
