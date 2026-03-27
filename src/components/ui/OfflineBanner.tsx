'use client';

import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);

    // Check initial state on next tick (avoids sync setState in effect)
    if (!navigator.onLine) {
      setTimeout(goOffline, 0);
    }
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-2 text-center text-sm text-[var(--color-warning)]"
    >
      You&apos;re offline. Editor and cached problems still work. Changes will sync when
      reconnected.
    </div>
  );
}

export default OfflineBanner;
