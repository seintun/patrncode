'use client';

import { type HTMLAttributes, type MouseEventHandler } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

function Card({ children, className, onClick, ...rest }: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
              }
            }
          : undefined
      }
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4',
        onClick &&
          'cursor-pointer transition-colors hover:bg-[var(--color-bg-elevated)] hover:border-[var(--color-accent)]/20',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export { Card };
export default Card;
