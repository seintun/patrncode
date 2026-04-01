import { render, screen } from '@testing-library/react';
import { CoinBalance } from '../CoinBalance';

describe('CoinBalance', () => {
  it('renders coin count for FREE tier', () => {
    render(<CoinBalance coins={42} tier="FREE" />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('renders "Premium" text for PREMIUM tier', () => {
    render(<CoinBalance coins={0} tier="PREMIUM" />);
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('does not render coin count for PREMIUM tier', () => {
    render(<CoinBalance coins={100} tier="PREMIUM" />);
    expect(screen.queryByText('100')).toBeNull();
  });

  it('aria-label includes coin count for FREE tier', () => {
    render(<CoinBalance coins={15} tier="FREE" />);
    expect(screen.getByLabelText(/15 coins/)).toBeInTheDocument();
  });

  it('coin count of 0 is rendered', () => {
    render(<CoinBalance coins={0} tier="FREE" />);
    expect(screen.getByText('0')).toBeInTheDocument();
  });
});
