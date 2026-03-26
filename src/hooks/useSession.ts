'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RunResult } from '@/lib/execution/runner';

interface HintRecord {
  level: number;
  content: string;
}

interface UseSessionOptions {
  sessionId: string;
}

interface UseSessionReturn {
  currentCode: string;
  testResults: RunResult | null;
  hintsUsed: HintRecord[];
  elapsedSeconds: number;
  updateCode: (code: string) => void;
  saveSnapshot: () => Promise<void>;
  setTestResults: (results: RunResult | null) => void;
  addHint: (level: number, content: string) => Promise<void>;
  getElapsedTime: () => string;
}

export function useSession({ sessionId }: UseSessionOptions): UseSessionReturn {
  const [currentCode, setCurrentCode] = useState('');
  const [testResults, setTestResults] = useState<RunResult | null>(null);
  const [hintsUsed, setHintsUsed] = useState<HintRecord[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [sessionStartTime] = useState(() => Date.now());

  const autoSaveTimerRef = useRef<ReturnType<typeof setInterval>>(null);
  const lastSavedCodeRef = useRef('');
  const codeRef = useRef('');

  // Keep codeRef in sync
  useEffect(() => {
    codeRef.current = currentCode;
  }, [currentCode]);

  // Update elapsed time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [sessionStartTime]);

  const saveSnapshot = useCallback(async () => {
    const code = codeRef.current;
    if (!sessionId || !code) return;

    try {
      await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      lastSavedCodeRef.current = code;
    } catch (err) {
      console.error('Failed to save code snapshot:', err);
    }
  }, [sessionId]);

  // Auto-save code snapshot every 30s
  useEffect(() => {
    autoSaveTimerRef.current = setInterval(() => {
      if (codeRef.current && codeRef.current !== lastSavedCodeRef.current) {
        saveSnapshot();
      }
    }, 30000);

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [saveSnapshot]);

  const updateCode = useCallback((code: string) => {
    setCurrentCode(code);
  }, []);

  const addHint = useCallback(
    async (level: number, content: string) => {
      setHintsUsed((prev) => [...prev, { level, content }]);

      try {
        await fetch(`/api/sessions/${sessionId}/hints`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ level, content }),
        });
      } catch (err) {
        console.error('Failed to persist hint:', err);
      }
    },
    [sessionId],
  );

  const getElapsedTime = useCallback(() => {
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, [elapsedSeconds]);

  return {
    currentCode,
    testResults,
    hintsUsed,
    elapsedSeconds,
    updateCode,
    saveSnapshot,
    setTestResults,
    addHint,
    getElapsedTime,
  };
}
