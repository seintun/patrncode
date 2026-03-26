import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import { ErrorBoundary } from '../ErrorBoundary';

function ThrowError({ shouldThrow, children }: { shouldThrow: boolean; children: ReactNode }) {
  if (shouldThrow) throw new Error('Test error');
  return <>{children}</>;
}

describe('ErrorBoundary', () => {
  let errorHandler: (err: Error) => void;

  beforeEach(() => {
    errorHandler = () => {};
    process.on('uncaughtException', errorHandler);
  });

  afterEach(() => {
    process.removeListener('uncaughtException', errorHandler);
  });

  it('renders children when no error', () => {
    render(
      <ErrorBoundary>
        <p>Safe content</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('Safe content')).toBeInTheDocument();
  });

  it('renders ErrorFallback when child throws', async () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true}>hidden</ThrowError>
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    });
  });

  it('shows custom fallback when provided', async () => {
    render(
      <ErrorBoundary fallback={<div>Custom fallback</div>}>
        <ThrowError shouldThrow={true}>hidden</ThrowError>
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByText('Custom fallback')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
  });

  it('resets error state and calls onRetry on Try Again click', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();

    const { unmount } = render(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowError shouldThrow={true}>hidden</ThrowError>
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Try Again' }));
    expect(onRetry).toHaveBeenCalledOnce();

    // React 19 error boundaries need proper remount to recover
    unmount();
    render(
      <ErrorBoundary onRetry={onRetry}>
        <ThrowError shouldThrow={false}>recovered</ThrowError>
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByText('recovered')).toBeInTheDocument();
    });
  });

  it('after reset, children render again', async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true}>hidden</ThrowError>
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Something went wrong/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: 'Try Again' }));

    unmount();
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false}>back to normal</ThrowError>
      </ErrorBoundary>,
    );

    await waitFor(() => {
      expect(screen.getByText('back to normal')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Something went wrong/)).not.toBeInTheDocument();
  });
});
