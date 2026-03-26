'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

type TabKey = 'statement' | 'examples' | 'notes';

interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface ProblemPanelProps {
  problem: {
    title: string;
    statement: string;
    examples: Example[];
    constraints: string[];
    starterCode?: string;
  };
  notes: string;
  onNotesChange: (notes: string) => void;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: 'statement', label: 'Statement' },
  { key: 'examples', label: 'Examples' },
  { key: 'notes', label: 'Notes' },
];

export function ProblemPanel({ problem, notes, onNotesChange }: ProblemPanelProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('statement');

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-[var(--color-border)] px-4 py-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{problem.title}</h2>
      </div>

      <div className="flex border-b border-[var(--color-border)]">
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

      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'statement' && (
          <div className="space-y-4">
            <pre className="whitespace-pre-wrap font-[family-name:var(--font-inter)] text-sm leading-relaxed text-[var(--color-text-primary)]">
              {problem.statement}
            </pre>
            {problem.constraints.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-secondary)]">
                  Constraints
                </h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-[var(--color-text-primary)]">
                  {problem.constraints.map((constraint, i) => (
                    <li key={i}>{constraint}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'examples' && (
          <div className="space-y-4">
            {problem.examples.map((example, i) => (
              <div
                key={i}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3"
              >
                <div className="mb-1 text-xs font-medium text-[var(--color-text-muted)]">
                  Example {i + 1}
                </div>
                <div className="space-y-2 font-[family-name:var(--font-jetbrains-mono)] text-sm">
                  <div>
                    <span className="text-[var(--color-text-muted)]">Input: </span>
                    <span className="text-[var(--color-text-primary)]">{example.input}</span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">Output: </span>
                    <span className="text-[var(--color-text-primary)]">{example.output}</span>
                  </div>
                  {example.explanation && (
                    <div>
                      <span className="text-[var(--color-text-muted)]">Explanation: </span>
                      <span className="text-[var(--color-text-secondary)]">
                        {example.explanation}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'notes' && (
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Jot down your thoughts, approach, or edge cases..."
            className="h-full w-full resize-none rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none"
          />
        )}
      </div>
    </div>
  );
}

export default ProblemPanel;
