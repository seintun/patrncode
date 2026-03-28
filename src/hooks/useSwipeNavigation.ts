'use client';

import { useCallback, useRef } from 'react';

interface UseSwipeNavigationOptions {
  tabs: string[];
  currentTab: string;
  onTabChange: (tab: string) => void;
}

interface SwipeHandlers {
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
}

export function useSwipeNavigation({ tabs, currentTab, onTabChange }: UseSwipeNavigationOptions): {
  swipeHandlers: SwipeHandlers;
} {
  const startX = useRef(0);
  const startY = useRef(0);
  const isSwiping = useRef(false);
  const isConfirmedSwipe = useRef(false);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    startX.current = e.clientX;
    startY.current = e.clientY;
    isSwiping.current = true;
    isConfirmedSwipe.current = false;
  }, []);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!isSwiping.current) return;

    const deltaX = Math.abs(e.clientX - startX.current);
    const deltaY = Math.abs(e.clientY - startY.current);

    // Once horizontal movement exceeds vertical, confirm it's a swipe
    // and prevent default to block browser back-swipe
    if (deltaX > 10 && deltaX > deltaY && !isConfirmedSwipe.current) {
      isConfirmedSwipe.current = true;
      e.preventDefault();
    }

    if (isConfirmedSwipe.current) {
      e.preventDefault();
    }
  }, []);

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!isSwiping.current) return;
      isSwiping.current = false;

      const deltaX = e.clientX - startX.current;
      const deltaY = e.clientY - startY.current;

      // Ignore vertical swipes
      if (Math.abs(deltaY) > Math.abs(deltaX)) return;

      const threshold = window.innerWidth * 0.2;

      if (Math.abs(deltaX) < threshold) return;

      const currentIndex = tabs.indexOf(currentTab);
      if (currentIndex === -1) return;

      if (deltaX < 0) {
        // Swipe left → next tab (with wrap)
        const nextIndex = (currentIndex + 1) % tabs.length;
        onTabChange(tabs[nextIndex]);
      } else {
        // Swipe right → previous tab (with wrap)
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        onTabChange(tabs[prevIndex]);
      }
    },
    [tabs, currentTab, onTabChange],
  );

  return {
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
    },
  };
}
