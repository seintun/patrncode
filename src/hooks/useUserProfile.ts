'use client';

import { useState, useEffect } from 'react';

interface UserProfile {
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  coins: number;
  tier: 'FREE' | 'PREMIUM';
}

const DEFAULT_PROFILE: UserProfile = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityAt: null,
  coins: 0,
  tier: 'FREE',
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;

    fetch('/api/user/profile', { signal: controller.signal })
      .then((r) => {
        if (!r.ok) return;
        return r.json() as Promise<UserProfile>;
      })
      .then((data) => {
        if (mounted && data) setProfile(data);
      })
      .catch(() => {});

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  return profile;
}
