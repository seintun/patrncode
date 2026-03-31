'use client';

import { useEffect, useRef } from 'react';

interface Problem {
  mastery: string | null;
}

export function useRoadmapCompletion(problems: Problem[]) {
  const hasFired = useRef(false);

  useEffect(() => {
    if (hasFired.current) return;

    const masteredCount = problems.filter((p) => p.mastery === 'MASTERED').length;
    const hasShownConfetti =
      typeof window !== 'undefined' && localStorage.getItem('sopho75_confetti_shown');

    if (masteredCount >= 75 && !hasShownConfetti) {
      hasFired.current = true;
      import('canvas-confetti').then(({ default: confetti }) => {
        confetti({ particleCount: 150, spread: 100, origin: { y: 0.6 } });
        localStorage.setItem('sopho75_confetti_shown', 'true');
      });
    }
  }, [problems]);
}
