'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface DailyChallenge {
  id: string;
  title: string;
  slug: string;
  difficulty: string;
  pattern: string;
}

interface DailyChallengeBannerProps {
  dailyChallenge: DailyChallenge | null;
  alreadySolved?: boolean;
}

export function DailyChallengeBanner({
  dailyChallenge,
  alreadySolved = false,
}: DailyChallengeBannerProps) {
  const [countdown, setCountdown] = useState('');

  useEffect(() => {
    if (!alreadySolved) return;
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
      );
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
      );
    };
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [alreadySolved]);

  if (!dailyChallenge) return null;

  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-elevated)] p-4">
      {alreadySolved ? (
        <div className="flex items-center gap-3">
          <span className="text-lg text-[var(--color-success)]">✓</span>
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">Completed!</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Tomorrow&apos;s challenge in {countdown}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-medium text-[var(--color-text-primary)]">
              🔥 Daily Challenge: {dailyChallenge.title}
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Master the fundamentals. Come back tomorrow for a new challenge. Earn +10 bonus coins
              on completion!
            </p>
          </div>
          <Link
            href={`/practice/${dailyChallenge.slug}`}
            className="shrink-0 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Solve Now →
          </Link>
        </div>
      )}
    </div>
  );
}

export default DailyChallengeBanner;
