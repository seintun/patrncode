'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SessionMode } from '@/lib/sophia';
import { SOPHIA_MODES } from '@/lib/sophia';

// ── Trigger messages by mode ─────────────────────────────────────────────────

const TRIGGER_MESSAGES: Record<string, Record<SessionMode, string>> = {
  session_start: {
    SELF_PRACTICE: 'Ready when you are.',
    COACH_ME: "Tell me how you're thinking about this.",
    MOCK_INTERVIEW: "I'll be evaluating your approach.",
  },
  code_empty_30s: {
    SELF_PRACTICE: 'Start with the simplest case first.',
    COACH_ME: "What's your first step here?",
    MOCK_INTERVIEW: 'The clock is running.',
  },
  first_test_fail: {
    SELF_PRACTICE: 'First attempt \u2014 keep going!',
    COACH_ME: 'What did you expect to happen?',
    MOCK_INTERVIEW: 'Noted.',
  },
  consecutive_fails_3: {
    SELF_PRACTICE: 'Stuck? Try a hint.',
    COACH_ME: 'Want to step back and rethink?',
    MOCK_INTERVIEW: 'Consider your edge cases.',
  },
  all_tests_pass: {
    SELF_PRACTICE: 'All green! Nice work.',
    COACH_ME: 'Every test passing \u2014 solid execution.',
    MOCK_INTERVIEW: 'Solution accepted.',
  },
  idle_60s: {
    SELF_PRACTICE: 'Still there? Take your time.',
    COACH_ME: "Thinking or stuck? I'm here.",
    MOCK_INTERVIEW: 'Take a moment.',
  },
  halfway_timer: {
    SELF_PRACTICE: "Halfway there \u2014 how's it going?",
    COACH_ME: 'How are you feeling about progress?',
    MOCK_INTERVIEW: "You're at the halfway mark.",
  },
  five_min_remaining: {
    SELF_PRACTICE: '5 minutes left \u2014 wrap up?',
    COACH_ME: 'Time check \u2014 where are you?',
    MOCK_INTERVIEW: '5 minutes remaining.',
  },
};

// ── Constants ────────────────────────────────────────────────────────────────

const BUBBLE_COOLDOWN_MS = 90_000;
const REPEATABLE_COOLDOWN_MS = 300_000; // 5 min
const IDLE_THRESHOLD_MS = 60_000;
const CODE_EMPTY_DELAY_MS = 30_000;
const SESSION_START_DELAY_MS = 5_000;

// ── Types ────────────────────────────────────────────────────────────────────

interface UseFloatingSophiaInput {
  mode: SessionMode;
  testResultsData?: { passed: number; total: number };
  isRunning: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  codeIsEmpty: boolean;
  isCoachOpen: boolean;
}

interface UseFloatingSophiaOutput {
  currentMessage: string | null;
  dismiss: () => void;
}

// ── Hook ─────────────────────────────────────────────────────────────────────

export function useFloatingSophia({
  mode,
  testResultsData,
  isRunning,
  elapsedSeconds,
  totalSeconds,
  codeIsEmpty,
  isCoachOpen,
}: UseFloatingSophiaInput): UseFloatingSophiaOutput {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const lastBubbleTime = useRef(0);
  const firedTriggers = useRef(new Set<string>());
  const lastIdleTime = useRef(0);
  const consecutiveFails = useRef(0);
  const prevTestResults = useRef<{ passed: number; total: number } | undefined>(undefined);

  const resolvedMode: SessionMode = SOPHIA_MODES[mode] ? mode : 'SELF_PRACTICE';

  // Track idle activity
  useEffect(() => {
    lastIdleTime.current = Date.now();
    const resetIdle = () => {
      lastIdleTime.current = Date.now();
    };
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    return () => {
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
    };
  }, []);

  const showMessage = useCallback(
    (triggerKey: string, repeatable = false) => {
      if (isCoachOpen) return;
      const now = Date.now();
      if (now - lastBubbleTime.current < BUBBLE_COOLDOWN_MS) return;

      if (!repeatable && firedTriggers.current.has(triggerKey)) return;
      if (repeatable && now - lastBubbleTime.current < REPEATABLE_COOLDOWN_MS) return;

      firedTriggers.current.add(triggerKey);
      lastBubbleTime.current = now;

      const messages = TRIGGER_MESSAGES[triggerKey];
      if (!messages) return;
      const text = messages[resolvedMode] ?? messages.SELF_PRACTICE;
      setCurrentMessage(text);
    },
    [isCoachOpen, resolvedMode],
  );

  const dismiss = useCallback(() => {
    setCurrentMessage(null);
  }, []);

  // ── Trigger: session_start (5s delay, once) ──────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      showMessage('session_start');
    }, SESSION_START_DELAY_MS);
    return () => clearTimeout(timer);
  }, [showMessage]);

  // ── Trigger: code_empty_30s (once) ──────────────────────────────────────
  useEffect(() => {
    if (!codeIsEmpty) return;
    const timer = setTimeout(() => {
      showMessage('code_empty_30s');
    }, CODE_EMPTY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [codeIsEmpty, showMessage]);

  // ── Trigger: first_test_fail / consecutive_fails_3 / all_tests_pass ─────
  useEffect(() => {
    if (!testResultsData || isRunning) return;

    const prev = prevTestResults.current;
    const { passed, total } = testResultsData;

    if (prev && prev.passed === passed && prev.total === total) return;
    prevTestResults.current = testResultsData;

    // Schedule trigger evaluation asynchronously to avoid sync setState in effect
    const handle = setTimeout(() => {
      if (passed < total) {
        if (!firedTriggers.current.has('first_test_fail')) {
          showMessage('first_test_fail');
        } else {
          consecutiveFails.current++;
          if (consecutiveFails.current >= 3) {
            showMessage('consecutive_fails_3', true);
            consecutiveFails.current = 0;
          }
        }
      } else if (passed === total && total > 0) {
        consecutiveFails.current = 0;
        showMessage('all_tests_pass');
        firedTriggers.current.delete('all_tests_pass');
      }
    }, 0);
    return () => clearTimeout(handle);
  }, [testResultsData, isRunning, showMessage]);

  // ── Trigger: idle_60s (5min cooldown) ────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      const idleDuration = Date.now() - lastIdleTime.current;
      if (idleDuration >= IDLE_THRESHOLD_MS) {
        showMessage('idle_60s', true);
        lastIdleTime.current = Date.now();
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [showMessage]);

  // ── Trigger: halfway_timer (once) ───────────────────────────────────────
  useEffect(() => {
    if (totalSeconds <= 0) return undefined;
    const halfSeconds = Math.floor(totalSeconds / 2);
    if (elapsedSeconds >= halfSeconds && elapsedSeconds < halfSeconds + 5) {
      const handle = setTimeout(() => {
        showMessage('halfway_timer');
      }, 0);
      return () => clearTimeout(handle);
    }
    return undefined;
  }, [elapsedSeconds, totalSeconds, showMessage]);

  // ── Trigger: five_min_remaining (once) ───────────────────────────────────
  useEffect(() => {
    if (totalSeconds <= 0) return undefined;
    const remaining = totalSeconds - elapsedSeconds;
    if (remaining <= 300 && remaining > 295) {
      const handle = setTimeout(() => {
        showMessage('five_min_remaining');
      }, 0);
      return () => clearTimeout(handle);
    }
    return undefined;
  }, [elapsedSeconds, totalSeconds, showMessage]);

  return {
    currentMessage,
    dismiss,
  };
}

export default useFloatingSophia;
