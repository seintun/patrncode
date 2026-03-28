'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export function AIBanner() {
  const [degraded, setDegraded] = useState(false);

  useEffect(() => {
    async function checkAI() {
      try {
        const res = await fetch('/api/ai/health');
        if (res.status === 503 || res.status === 500) {
          setDegraded(true);
        }
      } catch {
        setDegraded(true);
      }
    }

    checkAI();
  }, []);

  if (!degraded) return null;

  return (
    <div
      role="alert"
      className={cn(
        'border-b border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 px-4 py-1',
        'text-center text-sm text-[var(--color-warning)]',
      )}
    >
      AI features temporarily unavailable. Code editor and test execution still work normally.
    </div>
  );
}

export default AIBanner;
