'use client';

import { useEffect, useState } from 'react';
import { getGuestId } from '@/lib/guest';

export function useGuestId(): string {
  const [guestId, setGuestId] = useState('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setGuestId(getGuestId());
  }, []);

  return guestId;
}
