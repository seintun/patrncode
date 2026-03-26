import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Skeleton } from '../Skeleton';

describe('Skeleton', () => {
  it('renders div element', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild?.tagName).toBe('DIV');
  });

  it('has animate-pulse class', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstElementChild?.className).toContain('animate-pulse');
  });

  it('merges custom className', () => {
    const { container } = render(<Skeleton className="h-4 w-32" />);
    const el = container.firstElementChild!;
    expect(el.className).toContain('animate-pulse');
    expect(el.className).toContain('h-4');
    expect(el.className).toContain('w-32');
  });

  it('passes extra HTML attributes', () => {
    render(<Skeleton data-testid="skeleton" aria-label="loading" />);
    const el = screen.getByTestId('skeleton');
    expect(el).toHaveAttribute('aria-label', 'loading');
  });
});
