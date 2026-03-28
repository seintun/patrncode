'use client';

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';
import { BottomSheet } from './BottomSheet';
import { QuickPeekBadge } from './QuickPeekBadge';
import { useBottomSheet, useKeyboardHeight, useImmersiveMode } from '@/hooks/useBottomSheet';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';

// ── Types ────────────────────────────────────────────────────────────────────

type TabKey = 'problem' | 'code' | 'coach';

interface MobileWorkspaceProps {
  problem: ReactNode;
  editor: ReactNode;
  testResults: ReactNode;
  coach: ReactNode;
  testResultsData?: { passed: number; total: number };
  onEditorFocus?: () => void;
  onEditorBlur?: () => void;
  problemTitle?: string;
  constraints?: string[];
}

export interface MobileWorkspaceHandle {
  /** Call when Monaco editor gains focus. Triggers immersive mode when keyboard is open. */
  focusEditor: () => void;
  /** Call when Monaco editor losing focus. Exits immersive mode. */
  blurEditor: () => void;
  /** Programmatically open the Test Results sheet */
  openTestResults: () => void;
  /** Programmatically switch to and open the Coach sheet */
  openCoach: () => void;
}

// ── Constants ────────────────────────────────────────────────────────────────

const TABS: Array<{ key: TabKey; label: string; icon: ReactNode }> = [
  { 
    key: 'problem', 
    label: 'Problem',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
  },
  { 
    key: 'code', 
    label: 'Code',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="16 18 22 12 16 6"></polyline><polyline points="8 6 2 12 8 18"></polyline><line x1="14" y1="4" x2="10" y2="20"></line></svg>
  },
  { 
    key: 'coach', 
    label: 'Coach',
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path><line x1="9" y1="10" x2="15" y2="10"></line><line x1="12" y1="10" x2="12" y2="10"></line></svg>
  },
];

const TAB_BAR_HEIGHT = 48;

// ── Component ────────────────────────────────────────────────────────────────

export const MobileWorkspace = forwardRef<MobileWorkspaceHandle, MobileWorkspaceProps>(
  function MobileWorkspace(
    {
      problem,
      editor,
      testResults,
      coach,
      testResultsData,
      onEditorFocus,
      onEditorBlur,
      problemTitle,
      constraints = [],
    },
    ref,
  ) {
    // ── Tab state ───────────────────────────────────────────────────────────
    const [activeTab, setActiveTab] = useState<TabKey>('problem');

    // ── Bottom sheet state machines ─────────────────────────────────────────
    const problemSheet = useBottomSheet('closed');
    const testResultsSheet = useBottomSheet('closed');
    const coachSheet = useBottomSheet('closed');

    // ── Immersive mode ──────────────────────────────────────────────────────
    const { isImmersive, enterImmersive, exitImmersive } = useImmersiveMode();
    const { keyboardHeight, isKeyboardOpen } = useKeyboardHeight();

    // ── Dismiss pill visibility ─────────────────────────────────────────────
    const [showDismissPill, setShowDismissPill] = useState(false);
    const dismissPillShouldShow = useRef(false);
    const dismissPillTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Derived state ───────────────────────────────────────────────────────

    // Active sheet height for the current tab (only relevant for sheet-based tabs)
    const activeSheetHeight =
      activeTab === 'problem'
        ? problemSheet.height
        : activeTab === 'coach'
          ? coachSheet.height
          : 'closed';

    // ── Swipe navigation ────────────────────────────────────────────────────
    const { swipeHandlers } = useSwipeNavigation({
      tabs: TABS.map((t) => t.key),
      currentTab: activeTab,
      onTabChange: (tab) => handleTabChange(tab as TabKey),
    });

    // ── Tab change handler ──────────────────────────────────────────────────

    const handleTabChange = useCallback(
      (tab: TabKey) => {
        setActiveTab(tab);

        // Always close test results when navigating away
        testResultsSheet.close();

        if (tab === 'code') {
          problemSheet.close();
          coachSheet.close();
        } else if (tab === 'problem') {
          coachSheet.close();
          problemSheet.toggle();
        } else if (tab === 'coach') {
          problemSheet.close();
          coachSheet.toggle();
        }
      },
      [problemSheet, coachSheet, testResultsSheet],
    );

    // ── Editor focus / blur → immersive mode ────────────────────────────────
    // Exposed via ref so the parent can wire Monaco's onFocus/onBlur callbacks.

    const handleEditorFocus = useCallback(() => {
      if (!isKeyboardOpen) {
        onEditorFocus?.();
        return;
      }

      enterImmersive();
      onEditorFocus?.();
    }, [isKeyboardOpen, enterImmersive, onEditorFocus]);

    const handleEditorBlur = useCallback(() => {
      onEditorBlur?.();
      exitImmersive();
      dismissPillShouldShow.current = false;
      setShowDismissPill(false);
      if (dismissPillTimerRef.current) {
        clearTimeout(dismissPillTimerRef.current);
      }
    }, [onEditorBlur, exitImmersive]);

    const handleExitImmersive = useCallback(() => {
      exitImmersive();
      dismissPillShouldShow.current = false;
      setShowDismissPill(false);
      if (dismissPillTimerRef.current) {
        clearTimeout(dismissPillTimerRef.current);
      }
    }, [exitImmersive]);

    useImperativeHandle(
      ref,
      () => ({
        focusEditor: handleEditorFocus,
        blurEditor: handleEditorBlur,
        openTestResults: testResultsSheet.open,
        openCoach: () => handleTabChange('coach'),
      }),
      [handleEditorFocus, handleEditorBlur, testResultsSheet.open, handleTabChange],
    );

    // ── Dismiss pill: show after 1s of entering immersive mode ──────────────

    useEffect(() => {
      if (!isImmersive) {
        // Exiting immersive — cancel pending timer.
        dismissPillShouldShow.current = false;
        if (dismissPillTimerRef.current) {
          clearTimeout(dismissPillTimerRef.current);
        }
        return;
      }

      // Entering immersive — show dismiss pill after 1s of inactivity.
      dismissPillShouldShow.current = false;
      dismissPillTimerRef.current = setTimeout(() => {
        dismissPillShouldShow.current = true;
        setShowDismissPill(true);
      }, 1000);

      return () => {
        if (dismissPillTimerRef.current) {
          clearTimeout(dismissPillTimerRef.current);
        }
      };
    }, [isImmersive]);

    // ── Auto-collapse test results on all-pass ──────────────────────────────

    useEffect(() => {
      if (
        testResultsData &&
        testResultsData.passed === testResultsData.total &&
        testResultsData.total > 0 &&
        testResultsSheet.isOpen
      ) {
        autoCollapseTimerRef.current = setTimeout(() => {
          // Only collapse if no other sheet is on top blocking the view
          if (!coachSheet.isOpen) {
            testResultsSheet.close();
          }
        }, 2000);
      }

      return () => {
        if (autoCollapseTimerRef.current) {
          clearTimeout(autoCollapseTimerRef.current);
        }
      };
    }, [testResultsData, testResultsSheet, coachSheet.isOpen]);

    // ── Cleanup all timers on unmount ───────────────────────────────────────

    useEffect(() => {
      return () => {
        if (dismissPillTimerRef.current) clearTimeout(dismissPillTimerRef.current);
        if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current);
      };
    }, []);

    // ── Render ──────────────────────────────────────────────────────────────

    return (
      <div
        className="relative flex h-full flex-col overflow-hidden md:hidden"
        data-immersive={isImmersive ? 'true' : undefined}
        {...swipeHandlers}
      >
        {/* ── Editor (persistent base layer) ─────────────────────────────── */}
        <div
          className="flex flex-1 flex-col min-h-0"
          style={
            isImmersive
              ? {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: keyboardHeight,
                }
              : undefined
          }
        >
          {editor}
        </div>

        {/* ── Problem Bottom Sheet (z:10) ────────────────────────────────── */}
        <BottomSheet
          open={problemSheet.isOpen}
          height="large"
          zIndex={10}
          onClose={problemSheet.close}
        >
          <div className={cn('h-full', !isImmersive && 'pb-12')}>{problem}</div>
        </BottomSheet>

        {/* ── Test Results Bottom Sheet (z:20, draggable) ────────────────── */}
        <BottomSheet
          open={testResultsSheet.isOpen}
          height="large"
          zIndex={20}
          onClose={testResultsSheet.close}
        >
          <div className={cn('h-full', !isImmersive && 'pb-12')}>{testResults}</div>
        </BottomSheet>

        {/* ── Coach Bottom Sheet (z:30, 50vh) ────────────────────────────── */}
        <BottomSheet open={coachSheet.isOpen} height="large" zIndex={30} onClose={coachSheet.close}>
          <div className={cn('h-full', !isImmersive && 'pb-12')}>{coach}</div>
        </BottomSheet>

        {/* ── Bottom Tab Bar (z:40, hidden in immersive) ─────────────────── */}
        {!isImmersive && (
          <div
            role="tablist"
            aria-label="Session panels"
            className="z-40 flex border-t border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
            style={{ height: TAB_BAR_HEIGHT }}
          >
            {TABS.map((tab) => {
              const isActive =
                activeTab === tab.key && (tab.key === 'code' || activeSheetHeight !== 'closed');

              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  aria-controls={`mobile-panel-${tab.key}`}
                  id={`mobile-tab-${tab.key}`}
                  onClick={() => handleTabChange(tab.key)}
                  className={cn(
                    'flex flex-1 items-center justify-center gap-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                      : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
                  )}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Dismiss Pill (z:50, immersive only) ────────────────────────── */}
        {isImmersive && showDismissPill && (
          <button
            type="button"
            onClick={handleExitImmersive}
            aria-label="Exit fullscreen editor"
            className={cn(
              'absolute left-1/2 top-3 z-50 -translate-x-1/2 rounded-full',
              'border border-[var(--color-border)] bg-[var(--color-bg-elevated)]',
              'px-4 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]',
              'shadow-md transition-colors hover:text-[var(--color-text-primary)]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
              'dismiss-pill',
            )}
          >
            <span aria-hidden="true">{'\u00d7'}</span>
            <span className="ml-1">Exit</span>
          </button>
        )}

        {/* ── Quick Peek Badge (z:50, immersive only) ────────────────────── */}
        {isImmersive && problemTitle && (
          <QuickPeekBadge problemTitle={problemTitle} constraints={constraints} />
        )}
      </div>
    );
  },
);

export default MobileWorkspace;
