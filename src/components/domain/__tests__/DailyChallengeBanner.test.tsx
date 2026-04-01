import { render, screen, act } from '@testing-library/react';
import { DailyChallengeBanner } from '../DailyChallengeBanner';

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockChallenge = {
  id: 'prob1',
  title: 'Two Sum',
  slug: 'two-sum',
  difficulty: 'EASY',
  pattern: 'HASH_MAPS',
};

describe('DailyChallengeBanner', () => {
  it('renders nothing when dailyChallenge is null', () => {
    const { container } = render(<DailyChallengeBanner dailyChallenge={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows challenge title when unsolved', () => {
    render(<DailyChallengeBanner dailyChallenge={mockChallenge} />);
    expect(screen.getByText(/Two Sum/)).toBeInTheDocument();
  });

  it('shows "Solve Now" link to correct practice URL when unsolved', () => {
    render(<DailyChallengeBanner dailyChallenge={mockChallenge} alreadySolved={false} />);
    const link = screen.getByRole('link', { name: /solve now/i });
    expect(link).toHaveAttribute('href', '/practice/two-sum');
  });

  it('shows "Completed!" when alreadySolved=true', () => {
    render(<DailyChallengeBanner dailyChallenge={mockChallenge} alreadySolved={true} />);
    expect(screen.getByText('Completed!')).toBeInTheDocument();
  });

  it('shows tomorrow countdown text when completed', () => {
    render(<DailyChallengeBanner dailyChallenge={mockChallenge} alreadySolved={true} />);
    expect(screen.getByText(/Tomorrow's challenge in/)).toBeInTheDocument();
  });

  it('countdown displays HH:MM:SS format after timer fires', async () => {
    vi.useFakeTimers();
    render(<DailyChallengeBanner dailyChallenge={mockChallenge} alreadySolved={true} />);
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    // Should match HH:MM:SS
    expect(screen.getByText(/\d{2}:\d{2}:\d{2}/)).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('does not show countdown when unsolved', () => {
    render(<DailyChallengeBanner dailyChallenge={mockChallenge} alreadySolved={false} />);
    expect(screen.queryByText(/Tomorrow's challenge in/)).toBeNull();
  });
});
