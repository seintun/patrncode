'use client';

import {
  useState,
  useCallback,
  useRef,
  cloneElement,
  isValidElement,
  type ReactNode,
  useEffect,
} from 'react';
import { MobileWorkspace, type MobileWorkspaceHandle } from './MobileWorkspace';
import { FloatingSophia } from '@/components/ui/FloatingSophia';
import { useFloatingSophia } from '@/hooks/useFloatingSophia';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import type { SessionMode } from '@/lib/sophia';

interface SessionLayoutProps {
  problem: ReactNode;
  editor: ReactNode;
  testResults: ReactNode;
  coach: ReactNode;
  mode: SessionMode;
  testResultsData?: { passed: number; total: number };
  problemTitle?: string;
  constraints?: string[];
  workspaceRef?: React.RefObject<MobileWorkspaceHandle | null>;
  onRunTests?: () => void;
  isRunning?: boolean;
  elapsedSeconds?: number;
  totalSeconds?: number;
  codeIsEmpty?: boolean;
  onCoachToggle?: (isOpen: boolean) => void;
  codeLength?: number;
  testRunCount?: number;
}

export function SessionLayout({
  problem,
  editor,
  testResults,
  coach,
  mode,
  testResultsData,
  problemTitle,
  constraints,
  workspaceRef,
  onRunTests,
  isRunning,
  elapsedSeconds = 0,
  totalSeconds = 0,
  codeIsEmpty = false,
  onCoachToggle,
  codeLength,
  testRunCount,
}: SessionLayoutProps) {
  // Desktop coach panel state — only relevant on md+ screens
  const [isCoachOpen, setIsCoachOpen] = useState(false);
  // Mobile sheet state — any bottom sheet (problem, coach, test results)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const avatarButtonRef = useRef<HTMLButtonElement>(null);
  const [activeTab, setActiveTab] = useState<'problem' | 'code' | 'coach' | 'run'>('code');

  const handleCoachToggle = useCallback(() => {
    setIsCoachOpen((prev) => {
      const next = !prev;
      onCoachToggle?.(next);
      if (next) {
        setTimeout(
          () => (document.querySelector('[data-coach-input]') as HTMLElement | null)?.focus(),
          100,
        );
      }
      return next;
    });
  }, [onCoachToggle]);

  const handleCoachClose = useCallback(() => {
    setIsCoachOpen(false);
    onCoachToggle?.(false);
  }, [onCoachToggle]);

  // Restore focus to avatar button when coach closes (accessibility)
  const prevIsCoachOpen = useRef(isCoachOpen);
  useEffect(() => {
    if (prevIsCoachOpen.current && !isCoachOpen) {
      avatarButtonRef.current?.focus();
    }
    prevIsCoachOpen.current = isCoachOpen;
  }, [isCoachOpen]);

  const handleMobileSheetChange = useCallback((isOpen: boolean) => {
    setIsMobileSheetOpen(isOpen);
  }, []);

  const handleActiveTabChange = useCallback((tab: 'problem' | 'code' | 'coach' | 'run') => {
    setActiveTab(tab);
  }, []);

  // Suppress bubbles whenever any coach surface is open (desktop panel or mobile sheet)
  const isCoachSurfaceOpen = isCoachOpen || isMobileSheetOpen;

  const { currentMessage, dismiss } = useFloatingSophia({
    mode,
    testResultsData,
    isRunning: isRunning ?? false,
    elapsedSeconds,
    totalSeconds,
    codeIsEmpty,
    isCoachOpen: isCoachSurfaceOpen,
    codeLength,
    testRunCount,
    activeTab,
  });

  // Cmd+Shift+S toggles coach — on desktop opens panel, on mobile opens coach sheet
  useKeyboardShortcuts({
    onToggleCoach: handleCoachToggle,
  });

  const handleAvatarClick = useCallback(() => {
    if (isCoachOpen) {
      handleCoachClose();
    } else {
      dismiss();
      handleCoachToggle();
      // On mobile, open the coach sheet (no-op on desktop since workspace is hidden)
      workspaceRef?.current?.openCoach();
    }
  }, [isCoachOpen, handleCoachToggle, handleCoachClose, dismiss, workspaceRef]);

  // Inject onClose prop into coach component for desktop
  const coachWithClose =
    isCoachOpen && isValidElement(coach)
      ? cloneElement(coach as React.ReactElement<{ onClose?: () => void }>, {
          onClose: handleCoachClose,
        })
      : coach;

  return (
    <>
      {/* Desktop: grid with coach toggle */}
      <div
        className={`hidden h-full md:grid session-grid ${
          isCoachOpen ? 'md:grid-cols-[30%_40%_30%]' : 'md:grid-cols-[30%_70%]'
        }`}
      >
        <div className="flex h-full flex-col min-h-0 overflow-hidden border-r border-[var(--color-border)]">
          {problem}
        </div>
        <div className="flex h-full flex-col overflow-hidden border-r border-[var(--color-border)]">
          <div className="min-h-0 flex-1">{editor}</div>
          <div className="h-[35%] flex flex-col border-t border-[var(--color-border)]">
            {testResults}
          </div>
        </div>
        {isCoachOpen && (
          <div className="relative flex h-full flex-col min-h-0 overflow-hidden">
            {coachWithClose}
          </div>
        )}
      </div>

      {/* Mobile: bottom sheet architecture */}
      <div className="h-full md:hidden">
        <MobileWorkspace
          ref={workspaceRef}
          problem={problem}
          editor={editor}
          testResults={testResults}
          coach={coach}
          testResultsData={testResultsData}
          problemTitle={problemTitle}
          constraints={constraints}
          onRunTests={onRunTests}
          isRunning={isRunning}
          onSheetOpenChange={handleMobileSheetChange}
          onActiveTabChange={handleActiveTabChange}
        />
      </div>

      {/* Floating Sophia avatar — always visible */}
      <FloatingSophia
        currentMessage={currentMessage}
        isHidden={false}
        isDimmed={isCoachSurfaceOpen}
        mode={mode}
        onClick={handleAvatarClick}
        onDismiss={dismiss}
      />
    </>
  );
}

export default SessionLayout;
