import { cn } from '@/lib/utils';

interface KbdProps {
  children: React.ReactNode;
  className?: string;
}

export function Kbd({ children, className }: KbdProps) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-1 font-mono text-[10px] font-medium text-[var(--color-text-primary)] shadow-[0_1px_0_1px_rgba(0,0,0,0.1)] transition-colors group-hover:bg-[var(--color-bg-secondary)]',
        className,
      )}
    >
      {children}
    </kbd>
  );
}
