'use client';

interface CoinBalanceProps {
  coins: number;
  tier: 'FREE' | 'PREMIUM';
}

export function CoinBalance({ coins, tier }: CoinBalanceProps) {
  if (tier === 'PREMIUM') {
    return (
      <span
        className="flex items-center gap-1 text-sm font-medium text-[var(--color-accent)]"
        title="Premium subscriber — unlimited access"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
        </svg>
        <span className="text-xs">Premium</span>
      </span>
    );
  }

  return (
    <span
      className="flex items-center gap-1 text-sm font-medium text-yellow-500"
      title={`${coins} coins earned`}
      aria-label={`${coins} coins`}
    >
      {/* Coin SVG */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2" />
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
        <text x="12" y="16" textAnchor="middle" fontSize="10" fill="currentColor" fontWeight="bold">
          $
        </text>
      </svg>
      <span>{coins}</span>
    </span>
  );
}

export default CoinBalance;
