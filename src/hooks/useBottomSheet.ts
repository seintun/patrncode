'use client';

import { useCallback, useEffect, useState } from 'react';

export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;

    const viewport = window.visualViewport;
    const onResize = () => {
      const height = window.innerHeight - viewport.height;
      setKeyboardHeight(height > 0 ? height : 0);
    };

    viewport.addEventListener('resize', onResize);
    onResize();

    return () => {
      viewport.removeEventListener('resize', onResize);
    };
  }, []);

  return {
    keyboardHeight,
    isKeyboardOpen: keyboardHeight > 100,
  };
}

export type BottomSheetHeight = 'closed' | 'peek' | 'half' | 'full';

export function useBottomSheet(initialHeight: BottomSheetHeight = 'closed') {
  const [height, setHeight] = useState<BottomSheetHeight>(initialHeight);

  const open = useCallback(() => setHeight('peek'), []);
  const close = useCallback(() => setHeight('closed'), []);
  const toggle = useCallback(() => {
    setHeight((prev) => (prev === 'closed' ? 'peek' : 'closed'));
  }, []);

  return {
    height,
    setHeight,
    isOpen: height !== 'closed',
    open,
    close,
    toggle,
  };
}

export function useImmersiveMode() {
  const [isImmersive, setIsImmersive] = useState(false);

  const enterImmersive = useCallback(() => setIsImmersive(true), []);
  const exitImmersive = useCallback(() => setIsImmersive(false), []);

  return { isImmersive, enterImmersive, exitImmersive };
}
