import { render, screen, act, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SophiaBubble } from '../SophiaBubble';

describe('SophiaBubble', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the bubble container on mount', () => {
    render(<SophiaBubble text="Hello" stepKey={0} />);
    expect(screen.getByRole('region')).toBeInTheDocument();
  });

  it('reveals text character by character', () => {
    render(<SophiaBubble text="Hi" stepKey={0} />);
    act(() => {
      vi.advanceTimersByTime(30);
    });
    expect(screen.getByTestId('sophia-displayed').textContent).toContain('H');
    act(() => {
      vi.advanceTimersByTime(30);
    });
    expect(screen.getByTestId('sophia-displayed').textContent).toContain('Hi');
  });

  it('shows full text after all characters complete', () => {
    render(<SophiaBubble text="Hey" stepKey={0} />);
    act(() => {
      vi.advanceTimersByTime(30 * 3);
    });
    expect(screen.getByTestId('sophia-displayed').textContent).toContain('Hey');
  });

  it('click-to-skip shows full text immediately', () => {
    render(<SophiaBubble text="Hello there" stepKey={0} />);
    act(() => {
      fireEvent.click(screen.getByRole('region'));
    });
    expect(screen.getByTestId('sophia-displayed').textContent).toContain('Hello there');
  });

  it('resets animation when stepKey changes', async () => {
    const { rerender } = render(<SophiaBubble text="Hello" stepKey={0} />);
    act(() => {
      vi.advanceTimersByTime(30 * 5);
    }); // complete
    await act(async () => {
      rerender(<SophiaBubble text="Hello" stepKey={1} />);
    });
    expect(screen.getByTestId('sophia-displayed').textContent).toBe('');
  });

  it('renders Sophia avatar image', () => {
    render(<SophiaBubble text="Hi" stepKey={0} />);
    expect(screen.getByAltText('Sophia')).toBeInTheDocument();
  });
});
