'use client';

import { useEffect, useCallback, useRef } from 'react';

interface KeyboardShortcutHandlers {
  onRunTests?: () => void;
  onGetHint?: () => void;
  onToggleCoach?: () => void;
}

export function useKeyboardShortcuts({
  onRunTests,
  onGetHint,
  onToggleCoach,
}: KeyboardShortcutHandlers) {
  const handlersRef = useRef({ onRunTests, onGetHint, onToggleCoach });

  useEffect(() => {
    handlersRef.current = { onRunTests, onGetHint, onToggleCoach };
  }, [onRunTests, onGetHint, onToggleCoach]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const meta = e.metaKey || e.ctrlKey;

    if (meta && e.key === 'Enter') {
      e.preventDefault();
      handlersRef.current.onRunTests?.();
    }

    if (meta && e.key === 'h') {
      e.preventDefault();
      handlersRef.current.onGetHint?.();
    }

    if (meta && e.shiftKey && (e.key === 's' || e.key === 'S')) {
      e.preventDefault();
      handlersRef.current.onToggleCoach?.();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export default useKeyboardShortcuts;
