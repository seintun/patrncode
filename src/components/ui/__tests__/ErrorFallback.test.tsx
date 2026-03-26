import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ErrorFallback } from '../ErrorFallback';

describe('ErrorFallback', () => {
  const error = new Error('Something broke');

  it('renders error.message text', () => {
    render(<ErrorFallback error={error} onRetry={() => {}} />);
    expect(screen.getByText(/Something broke/)).toBeInTheDocument();
  });

  it('renders children when provided', () => {
    render(
      <ErrorFallback error={error} onRetry={() => {}}>
        Extra detail
      </ErrorFallback>,
    );
    expect(screen.getByText('Extra detail')).toBeInTheDocument();
  });

  it('calls onRetry when Try Again button clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorFallback error={error} onRetry={onRetry} />);

    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('does not render children section when not provided', () => {
    render(<ErrorFallback error={error} onRetry={() => {}} />);
    const pre = screen.getByText(/Something broke/);
    expect(pre).toBeInTheDocument();
    expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    const paragraphs = screen.getAllByRole('paragraph');
    const childParagraph = paragraphs.find((p) => p.textContent === 'Extra detail');
    expect(childParagraph).toBeUndefined();
  });
});
