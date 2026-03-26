'use client';

import { useState, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type TabKey = 'problem' | 'code' | 'coach';

interface SessionLayoutProps {
  problem: ReactNode;
  editor: ReactNode;
  testResults: ReactNode;
  coach: ReactNode;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'problem', label: 'Problem' },
  { key: 'code', label: 'Code' },
  { key: 'coach', label: 'Coach' },
];

export function SessionLayout({ problem, editor, testResults, coach }: SessionLayoutProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('problem');

  return (
    <>
      {/* Desktop: 3-column grid */}
      <div className="hidden h-full md:grid md:grid-cols-[30%_40%_30%]">
        <div className="border-r border-[var(--color-border)] overflow-y-auto">{problem}</div>
        <div className="flex flex-col border-r border-[var(--color-border)] overflow-hidden">
          <div className="flex-1 min-h-0">{editor}</div>
          <div className="border-t border-[var(--color-border)] h-[35%] overflow-y-auto">
            {testResults}
          </div>
        </div>
        <div className="overflow-y-auto">{coach}</div>
      </div>

      {/* Mobile: tabs */}
      <div className="flex h-full flex-col md:hidden">
        <div className="flex border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex-1 px-4 py-2 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'border-b-2 border-[var(--color-accent)] text-[var(--color-accent)]'
                  : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'problem' && problem}
          {activeTab === 'code' && (
            <div className="flex h-full flex-col">
              <div className="flex-1 min-h-0">{editor}</div>
              <div className="border-t border-[var(--color-border)] h-[35%] overflow-y-auto">
                {testResults}
              </div>
            </div>
          )}
          {activeTab === 'coach' && coach}
        </div>
      </div>
    </>
  );
}

export default SessionLayout;
