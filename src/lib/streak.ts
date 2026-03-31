export interface StreakResult {
  current: number;
  longest: number;
  wonToday: boolean;
  lastActivityAt: Date;
}

export function calculateStreak(
  lastActivityAt: Date | null,
  streakLastWonAt: Date | null,
  currentStreak: number,
  longestStreak: number,
): StreakResult {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const lastUTC = lastActivityAt
    ? Date.UTC(
        lastActivityAt.getUTCFullYear(),
        lastActivityAt.getUTCMonth(),
        lastActivityAt.getUTCDate(),
      )
    : 0;
  const wonUTC = streakLastWonAt
    ? Date.UTC(
        streakLastWonAt.getUTCFullYear(),
        streakLastWonAt.getUTCMonth(),
        streakLastWonAt.getUTCDate(),
      )
    : 0;

  const wonToday = wonUTC === todayUTC;
  const lastWasYesterday = lastUTC === todayUTC - 86400000;
  const lastWasToday = lastUTC === todayUTC;

  let newCurrent = currentStreak;
  let newLongest = longestStreak;

  if (lastWasToday && !wonToday) {
    // Same day, not yet counted — no change
  } else if (lastWasYesterday && !wonToday) {
    // Continuing streak from yesterday
    newCurrent = currentStreak + 1;
  } else if (lastWasToday && wonToday) {
    // Already counted today — no change
  } else {
    // Streak broken (missed a day or first activity)
    newCurrent = 1;
  }

  newLongest = Math.max(newLongest, newCurrent);

  return {
    current: newCurrent,
    longest: newLongest,
    wonToday,
    lastActivityAt: now,
  };
}
