'use client';

import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

const variantStyles = {
  primary:
    'bg-[var(--color-accent)] text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)] hover:shadow-[0_0_16px_-4px_var(--color-accent)]',
  secondary:
    'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
  ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]',
};

const sizeStyles = {
  sm: 'px-3 py-2 text-sm min-h-11',
  md: 'px-5 py-2.5 text-base min-h-11',
  lg: 'px-6 py-3.5 text-lg min-h-12',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', disabled, className, children, ...rest }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          'inline-flex items-center justify-center rounded-lg font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-primary)]',
          variantStyles[variant],
          sizeStyles[size],
          disabled && 'pointer-events-none opacity-50',
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';

export { Button };
export default Button;
