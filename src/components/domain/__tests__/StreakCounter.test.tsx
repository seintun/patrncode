import { render, screen } from '@testing-library/react';
import { StreakCounter } from '../StreakCounter';

describe('StreakCounter', () => {
  it('renders streak count', () => {
    render(<StreakCounter currentStreak={5} longestStreak={10} lastActivityAt={null} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('streak=0 applies muted color class', () => {
    const { container } = render(
      <StreakCounter currentStreak={0} longestStreak={0} lastActivityAt={null} />,
    );
    expect(container.firstChild).toHaveClass('text-[var(--color-text-muted)]');
  });

  it('streak=3 applies orange-500 color class', () => {
    const { container } = render(
      <StreakCounter currentStreak={3} longestStreak={3} lastActivityAt={null} />,
    );
    expect(container.firstChild).toHaveClass('text-orange-500');
  });

  it('streak=7 applies yellow-500 color class', () => {
    const { container } = render(
      <StreakCounter currentStreak={7} longestStreak={7} lastActivityAt={null} />,
    );
    expect(container.firstChild).toHaveClass('text-yellow-500');
  });

  it('streak=30 applies yellow-400 color class', () => {
    const { container } = render(
      <StreakCounter currentStreak={30} longestStreak={30} lastActivityAt={null} />,
    );
    expect(container.firstChild).toHaveClass('text-yellow-400');
  });

  it('does not show at-risk pulse when streak=0 even if lastActivityAt is old', () => {
    const old = new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString();
    const { container } = render(
      <StreakCounter currentStreak={0} longestStreak={0} lastActivityAt={old} />,
    );
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  it('shows at-risk pulse when streak > 0 and lastActivityAt is > 20h ago', () => {
    const old = new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString();
    const { container } = render(
      <StreakCounter currentStreak={3} longestStreak={5} lastActivityAt={old} />,
    );
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });

  it('does not show at-risk pulse when lastActivityAt is recent', () => {
    const recent = new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString();
    const { container } = render(
      <StreakCounter currentStreak={3} longestStreak={5} lastActivityAt={recent} />,
    );
    expect(container.querySelector('.animate-pulse')).toBeNull();
  });

  it('aria-label includes streak count', () => {
    render(<StreakCounter currentStreak={5} longestStreak={10} lastActivityAt={null} />);
    expect(screen.getByLabelText(/5 days/)).toBeInTheDocument();
  });
});
