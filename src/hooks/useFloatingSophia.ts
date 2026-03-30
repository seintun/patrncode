'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { SessionMode } from '@/lib/sophia';
import { SOPHIA_MODES } from '@/lib/sophia';

// ── Trigger messages by mode ─────────────────────────────────────────────────

function getRandomMessage(pool: string[]): string {
  return pool[Math.floor(Math.random() * pool.length)];
}

const TRIGGER_MESSAGES: Record<string, Record<SessionMode, string[]>> = {
  session_start: {
    SELF_PRACTICE: [
      'Ready when you are.',
      'Take your time \u2014 I\u2019m here.',
      'Let\u2019s work through this together.',
    ],
    COACH_ME: [
      'Tell me how you\u2019re thinking about this.',
      'What\u2019s your first instinct?',
      'Before you code \u2014 what\u2019s the shape of a solution?',
    ],
    MOCK_INTERVIEW: [
      'I\u2019ll be evaluating your approach.',
      'Think out loud as you work.',
      'Clarity of reasoning matters here.',
    ],
  },
  code_empty_30s: {
    SELF_PRACTICE: [
      'Start with the simplest case first.',
      'Even a stub gets you moving.',
      'What\u2019s the tiniest thing you can write?',
    ],
    COACH_ME: [
      'What\u2019s your first step here?',
      'What do you know about this problem?',
      'What would a brute force look like?',
    ],
    MOCK_INTERVIEW: [
      'The clock is running.',
      'Time to start.',
      'A partial solution is better than none.',
    ],
  },
  first_test_fail: {
    SELF_PRACTICE: [
      'First attempt \u2014 keep going!',
      'Expected. Now iterate.',
      'Failures are information.',
    ],
    COACH_ME: [
      'What did you expect to happen?',
      'What\u2019s the output telling you?',
      'Walk me through your logic.',
    ],
    MOCK_INTERVIEW: ['Noted.', 'Investigate the failure.', 'What does the error say?'],
  },
  consecutive_fails_3: {
    SELF_PRACTICE: [
      'Stuck? Try a hint.',
      'Three misses \u2014 want to step back?',
      'Sometimes a fresh look helps.',
    ],
    COACH_ME: [
      'Want to step back and rethink?',
      'What assumption might be wrong?',
      'What\u2019s the simplest failing case?',
    ],
    MOCK_INTERVIEW: [
      'Consider your edge cases.',
      'Revisit your algorithm.',
      'Check boundary conditions.',
    ],
  },
  all_tests_pass: {
    SELF_PRACTICE: [
      'All green! Nice work.',
      'Every test passing \u2014 well done.',
      'That\u2019s the solution.',
    ],
    COACH_ME: [
      'Every test passing \u2014 solid execution.',
      'How confident are you in this?',
      'What\u2019s the time complexity?',
    ],
    MOCK_INTERVIEW: [
      'Solution accepted.',
      'All cases pass.',
      'Note the complexity for discussion.',
    ],
  },
  idle_60s: {
    SELF_PRACTICE: [
      'Still there? Take your time.',
      'No rush \u2014 thinking is work too.',
      'Stuck or just thinking?',
    ],
    COACH_ME: [
      'Thinking or stuck? I\u2019m here.',
      'What\u2019s running through your head?',
      'Talk me through where you are.',
    ],
    MOCK_INTERVIEW: ['Take a moment.', 'Verbalize your thinking.', 'What\u2019s blocking you?'],
  },
  halfway_timer: {
    SELF_PRACTICE: [
      'Halfway there \u2014 how\u2019s it going?',
      'Half the time used. On track?',
      'Midpoint check \u2014 how are you feeling?',
    ],
    COACH_ME: [
      'How are you feeling about progress?',
      'Halfway \u2014 what do you have so far?',
      'What\u2019s left to do?',
    ],
    MOCK_INTERVIEW: [
      'You\u2019re at the halfway mark.',
      'Half time. Assess your progress.',
      'Pace yourself.',
    ],
  },
  five_min_remaining: {
    SELF_PRACTICE: [
      '5 minutes left \u2014 wrap up?',
      'Almost there \u2014 finish strong.',
      'Time to finalize.',
    ],
    COACH_ME: [
      'Time check \u2014 where are you?',
      '5 left \u2014 what\u2019s unfinished?',
      'What would you cut to ship?',
    ],
    MOCK_INTERVIEW: [
      '5 minutes remaining.',
      'Final push.',
      'Focus on correctness over completeness.',
    ],
  },
  problem_tab_long: {
    SELF_PRACTICE: [
      'Still reading? The constraints often hint at the approach.',
      'Spotted any edge cases in the examples?',
    ],
    COACH_ME: ['What are the key constraints here?', 'What patterns do you see in the examples?'],
    MOCK_INTERVIEW: [
      'You\u2019ve been on the problem statement a while.',
      'What\u2019s your initial read?',
    ],
  },
  code_stagnant_with_failures: {
    SELF_PRACTICE: [
      'Stuck on failing tests? Writing it out on paper sometimes helps.',
      'Same code, same failures. Time to try something different?',
    ],
    COACH_ME: [
      'What\u2019s the specific line that\u2019s failing?',
      'What would need to be true for this to pass?',
    ],
    MOCK_INTERVIEW: ['What\u2019s your next move?', 'Diagnose before you fix.'],
  },
  rapid_test_runs: {
    SELF_PRACTICE: [
      'Running lots of tests. Want to think through the algorithm first?',
      'Trial and error is valid \u2014 what are you learning?',
    ],
    COACH_ME: ['What are you learning from each run?', 'What hypothesis are you testing?'],
    MOCK_INTERVIEW: ['What\u2019s the pattern in your failures?', 'Be methodical.'],
  },
  problem_revisit_after_fail: {
    SELF_PRACTICE: [
      'Re-reading the problem \u2014 smart. Easy to miss edge cases on first pass.',
      'Something in the problem catch your eye?',
    ],
    COACH_ME: ['What caught your attention this time?', 'What did you miss the first time?'],
    MOCK_INTERVIEW: ['What are you checking?', 'Good instinct.'],
  },
  rapid_tab_switching: {
    SELF_PRACTICE: [
      'Jumping around a lot. Want to talk through your approach?',
      'Feeling scattered? Let\u2019s ground in one thing.',
    ],
    COACH_ME: ['What are you looking for?', 'What would help you move forward?'],
    MOCK_INTERVIEW: ['Focus. Pick a direction.', 'Commit to an approach.'],
  },
};

// ── Constants ────────────────────────────────────────────────────────────────

const BUBBLE_COOLDOWN_MS = 90_000;
const REPEATABLE_COOLDOWN_MS = 300_000;
const IDLE_THRESHOLD_MS = 60_000;
const CODE_EMPTY_DELAY_MS = 30_000;
const SESSION_START_DELAY_MS = 5_000;
const PROBLEM_TAB_DWELL_MS = 180_000;
const CODE_STAGNANT_MS = 180_000;
const RAPID_RUN_WINDOW_MS = 300_000;
const RAPID_RUN_MIN_COUNT = 5;
const RAPID_TAB_SWITCH_COUNT = 5;
const RAPID_TAB_SWITCH_WINDOW_MS = 60_000;

// ── Types ────────────────────────────────────────────────────────────────────

interface UseFloatingSophiaInput {
  mode: SessionMode;
  testResultsData?: { passed: number; total: number };
  isRunning: boolean;
  elapsedSeconds: number;
  totalSeconds: number;
  codeIsEmpty: boolean;
  isCoachOpen: boolean;
  codeLength?: number;
  testRunCount?: number;
  activeTab?: 'problem' | 'code' | 'coach' | 'run';
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
  codeLength,
  testRunCount,
  activeTab,
}: UseFloatingSophiaInput): UseFloatingSophiaOutput {
  const [currentMessage, setCurrentMessage] = useState<string | null>(null);
  const lastBubbleTime = useRef(0);
  const firedTriggers = useRef(new Set<string>());
  const lastIdleTime = useRef(0);
  const consecutiveFails = useRef(0);
  const prevTestResults = useRef<{ passed: number; total: number } | undefined>(undefined);
  const codeLengthRef = useRef(codeLength ?? 0);
  const lastCodeLengthChangeTime = useRef(0);
  const lastCodeLengthTracked = useRef(codeLength ?? 0);
  const tabDwellStart = useRef(0);
  const tabSwitchTimes = useRef<number[]>([]);
  const firstRapidRunTime = useRef(0);
  const prevActiveTab = useRef(activeTab ?? 'code');
  const prevTestRunCount = useRef(testRunCount ?? 0);

  const resolvedMode: SessionMode = SOPHIA_MODES[mode] ? mode : 'SELF_PRACTICE';

  // Track idle activity
  useEffect(() => {
    lastIdleTime.current = Date.now();
    lastCodeLengthChangeTime.current = Date.now();
    tabDwellStart.current = Date.now();
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
      const pool = messages[resolvedMode] ?? messages.SELF_PRACTICE;
      const text = getRandomMessage(pool);
      setCurrentMessage(text);
    },
    [isCoachOpen, resolvedMode],
  );

  const dismiss = useCallback(() => {
    setCurrentMessage(null);
  }, []);

  useEffect(() => {
    if (codeLength !== undefined && codeLength !== lastCodeLengthTracked.current) {
      lastCodeLengthTracked.current = codeLength;
      lastCodeLengthChangeTime.current = Date.now();
    }
    codeLengthRef.current = codeLength ?? 0;
  }, [codeLength]);

  useEffect(() => {
    if (activeTab && activeTab !== prevActiveTab.current) {
      tabDwellStart.current = Date.now();

      const now = Date.now();
      tabSwitchTimes.current.push(now);
      tabSwitchTimes.current = tabSwitchTimes.current.filter(
        (t) => now - t < RAPID_TAB_SWITCH_WINDOW_MS,
      );

      if (
        activeTab === 'problem' &&
        firedTriggers.current.has('first_test_fail') &&
        !firedTriggers.current.has('problem_revisit_after_fail')
      ) {
        setTimeout(() => showMessage('problem_revisit_after_fail'), 0);
      }

      prevActiveTab.current = activeTab;
    }
  }, [activeTab, showMessage]);

  useEffect(() => {
    if (testRunCount !== undefined && testRunCount > prevTestRunCount.current) {
      const now = Date.now();
      if (firstRapidRunTime.current === 0) {
        firstRapidRunTime.current = now;
      }
      prevTestRunCount.current = testRunCount;
    }
  }, [testRunCount]);

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
      const now = Date.now();

      const idleDuration = now - lastIdleTime.current;
      if (idleDuration >= IDLE_THRESHOLD_MS) {
        showMessage('idle_60s', true);
        lastIdleTime.current = now;
      }

      if (
        activeTab === 'problem' &&
        codeIsEmpty &&
        now - tabDwellStart.current >= PROBLEM_TAB_DWELL_MS &&
        !firedTriggers.current.has('problem_tab_long')
      ) {
        showMessage('problem_tab_long');
      }

      if (
        testResultsData &&
        testResultsData.passed < testResultsData.total &&
        now - lastCodeLengthChangeTime.current >= CODE_STAGNANT_MS &&
        !firedTriggers.current.has('code_stagnant_with_failures')
      ) {
        showMessage('code_stagnant_with_failures');
      }

      if (
        testRunCount !== undefined &&
        testRunCount >= RAPID_RUN_MIN_COUNT &&
        firstRapidRunTime.current > 0 &&
        now - firstRapidRunTime.current < RAPID_RUN_WINDOW_MS &&
        !firedTriggers.current.has('rapid_test_runs')
      ) {
        showMessage('rapid_test_runs');
      }

      if (
        tabSwitchTimes.current.length >= RAPID_TAB_SWITCH_COUNT &&
        !firedTriggers.current.has('rapid_tab_switching')
      ) {
        showMessage('rapid_tab_switching');
        tabSwitchTimes.current = [];
      }
    }, 10_000);
    return () => clearInterval(interval);
  }, [showMessage, activeTab, codeIsEmpty, testResultsData, testRunCount]);

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
