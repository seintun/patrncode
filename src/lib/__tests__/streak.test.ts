import { calculateStreak } from '../streak';

function yesterdayUTC(): Date {
  const now = new Date();
  const todayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  return new Date(todayUTC - 86400000);
}

function todayUTCDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

describe('calculateStreak', () => {
  it('first activity — no previous data', () => {
    const result = calculateStreak(null, null, 0, 0);

    expect(result.current).toBe(1);
    expect(result.longest).toBe(1);
    expect(result.wonToday).toBe(false);
    expect(result.lastActivityAt).toBeInstanceOf(Date);
  });

  it('continuing streak from yesterday', () => {
    const yesterday = yesterdayUTC();

    const result = calculateStreak(yesterday, yesterday, 3, 5);

    expect(result.current).toBe(4);
    expect(result.longest).toBe(5);
    expect(result.wonToday).toBe(false);
  });

  it('continuing streak from yesterday updates longest if surpassed', () => {
    const yesterday = yesterdayUTC();

    const result = calculateStreak(yesterday, yesterday, 5, 5);

    expect(result.current).toBe(6);
    expect(result.longest).toBe(6);
  });

  it('same day, already won — no change', () => {
    const today = todayUTCDate();

    const result = calculateStreak(today, today, 3, 5);

    expect(result.current).toBe(3);
    expect(result.longest).toBe(5);
    expect(result.wonToday).toBe(true);
  });

  it('same day, not yet won — no change to current', () => {
    const today = todayUTCDate();

    const result = calculateStreak(today, null, 3, 5);

    expect(result.current).toBe(3);
    expect(result.longest).toBe(5);
    expect(result.wonToday).toBe(false);
  });

  it('streak broken — missed a day', () => {
    const twoDaysAgo = new Date(Date.now() - 2 * 86400000);

    const result = calculateStreak(twoDaysAgo, twoDaysAgo, 5, 10);

    expect(result.current).toBe(1);
    expect(result.longest).toBe(10);
    expect(result.wonToday).toBe(false);
  });

  it('streak broken — missed multiple days resets to 1', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 86400000);

    const result = calculateStreak(fiveDaysAgo, fiveDaysAgo, 10, 15);

    expect(result.current).toBe(1);
    expect(result.longest).toBe(15);
  });

  describe('UTC boundary edge cases', () => {
    it('activity at 23:59:59 UTC is still today', () => {
      const now = new Date();
      const endOfTodayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59),
      );

      const result = calculateStreak(endOfTodayUTC, endOfTodayUTC, 3, 5);

      expect(result.wonToday).toBe(true);
      expect(result.current).toBe(3);
    });

    it('activity at 00:00:00 UTC is today', () => {
      const now = new Date();
      const startOfTodayUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0),
      );

      const result = calculateStreak(startOfTodayUTC, startOfTodayUTC, 2, 4);

      expect(result.wonToday).toBe(true);
      expect(result.current).toBe(2);
    });

    it('streak continues across UTC midnight boundary', () => {
      const now = new Date();
      const startOfTodayUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      // Strip time, so it should be yesterday when stripped to date
      const yesterdayDateStripped = new Date(startOfTodayUTC - 86400000);

      const result = calculateStreak(yesterdayDateStripped, yesterdayDateStripped, 7, 10);

      expect(result.current).toBe(8);
      expect(result.longest).toBe(10);
    });

    it('activity exactly 2 days ago breaks streak', () => {
      const now = new Date();
      const twoDaysAgoUTC = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 2 * 86400000,
      );

      const result = calculateStreak(twoDaysAgoUTC, twoDaysAgoUTC, 5, 8);

      expect(result.current).toBe(1);
      expect(result.longest).toBe(8);
    });
  });
});
