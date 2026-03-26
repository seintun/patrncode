'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import type { SessionMode } from '@/generated/prisma/enums';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface CoachingPanelProps {
  mode: SessionMode;
  onHintRequest: (level: number) => void;
  hintLevel: number;
}

const modeLabels: Record<SessionMode, string> = {
  SELF_PRACTICE: 'Self-Practice',
  COACH_ME: 'Coach Me',
  MOCK_INTERVIEW: 'Mock Interview',
};

export function CoachingPanel({ mode, onHintRequest, hintLevel }: CoachingPanelProps) {
  const [messages] = useState<Message[]>([]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Coach</h3>
        <span className="inline-flex items-center rounded-full bg-[var(--color-ai-coach)]/20 px-2.5 py-0.5 text-xs font-medium text-[var(--color-ai-coach)]">
          {modeLabels[mode]}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">AI coaching will appear here</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onHintRequest(hintLevel + 1)}
              disabled={hintLevel >= 3}
            >
              Get Hint (Level {hintLevel >= 3 ? '3 (max)' : hintLevel + 1})
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm',
                  msg.role === 'assistant'
                    ? 'bg-[var(--color-ai-coach)]/10 text-[var(--color-text-primary)]'
                    : 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]',
                )}
              >
                {msg.content}
              </div>
            ))}
            <div className="flex justify-center">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onHintRequest(hintLevel + 1)}
                disabled={hintLevel >= 3}
              >
                Get Hint (Level {hintLevel >= 3 ? '3 (max)' : hintLevel + 1})
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Input area — disabled placeholder */}
      <div className="border-t border-[var(--color-border)] p-3">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2">
          <input
            type="text"
            disabled
            placeholder="AI coaching coming soon..."
            className="flex-1 bg-transparent text-sm text-[var(--color-text-muted)] placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:cursor-not-allowed"
          />
          <span className="text-xs text-[var(--color-text-muted)]">⌘↵</span>
        </div>
      </div>
    </div>
  );
}

export default CoachingPanel;
