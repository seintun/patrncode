'use client';

import { type ReactNode } from 'react';
import { MobileWorkspace, type MobileWorkspaceHandle } from './MobileWorkspace';

interface SessionLayoutProps {
  problem: ReactNode;
  editor: ReactNode;
  testResults: ReactNode;
  coach: ReactNode;
  testResultsData?: { passed: number; total: number };
  problemTitle?: string;
  constraints?: string[];
  workspaceRef?: React.RefObject<MobileWorkspaceHandle | null>;
  onRunTests?: () => void;
  isRunning?: boolean;
}

export function SessionLayout({
  problem,
  editor,
  testResults,
  coach,
  testResultsData,
  problemTitle,
  constraints,
  workspaceRef,
  onRunTests,
  isRunning,
}: SessionLayoutProps) {
  return (
    <>
      {/* Desktop: 3-column grid */}
      <div className="hidden h-full md:grid md:grid-cols-[30%_40%_30%]">
        <div className="flex flex-col border-r border-[var(--color-border)]">{problem}</div>
        <div className="flex flex-col overflow-hidden border-r border-[var(--color-border)]">
          <div className="min-h-0 flex-1">{editor}</div>
          <div className="h-[35%] flex flex-col border-t border-[var(--color-border)]">
            {testResults}
          </div>
        </div>
        <div className="flex flex-col">{coach}</div>
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
        />
      </div>
    </>
  );
}

export default SessionLayout;
