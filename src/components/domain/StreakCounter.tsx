'use client';

import { type FC } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null; // ISO string from API
}

// ── Component ────────────────────────────────────────────────────────────────

function isStreakAtRisk(lastActivityAt: string | null, currentStreak: number): boolean {
  if (!lastActivityAt || currentStreak === 0) return false;
  const hoursSince = (Date.now() - new Date(lastActivityAt).getTime()) / (1000 * 60 * 60);
  return hoursSince >= 20;
}

export const StreakCounter: FC<StreakCounterProps> = ({
  currentStreak,
  longestStreak,
  lastActivityAt,
}) => {
  const atRisk = isStreakAtRisk(lastActivityAt, currentStreak);

  // Determine color based on milestone
  let colorClass = 'text-[var(--color-text-muted)]'; // 0 or 1-2
  if (currentStreak >= 30) colorClass = 'text-yellow-400';
  else if (currentStreak >= 7) colorClass = 'text-yellow-500';
  else if (currentStreak >= 3) colorClass = 'text-orange-500';
  else if (currentStreak >= 1) colorClass = 'text-gray-400';

  return (
    <div
      className={`relative flex items-center gap-1 text-sm font-medium ${colorClass}`}
      title={`Current streak: ${currentStreak} days | Longest: ${longestStreak} days`}
      aria-label={`Current streak: ${currentStreak} days`}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 23c-4.97 0-9-3.58-9-8 0-2.52.74-4.6 2.5-6.5C7.56 6.44 9 4 9 1c0 0 1.5 2.5 3 4 1.5-1.5 3-4 3-4 0 3 1.44 5.44 3.5 7.5C20.26 10.4 21 12.48 21 15c0 4.42-4.03 8-9 8z" />
      </svg>
      <span>{currentStreak}</span>
      {atRisk && (
        <span className="absolute -right-1 -top-1 h-2 w-2 animate-pulse rounded-full bg-yellow-400" />
      )}
    </div>
  );
};

export default StreakCounter;
