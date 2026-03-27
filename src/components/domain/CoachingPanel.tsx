'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { getSophiaConfig, SOPHIA_AVATAR } from '@/lib/sophia';
import type { SessionMode } from '@/generated/prisma/enums';
import type { UIMessage } from 'ai';

interface CoachingPanelProps {
  mode: SessionMode;
  messages: UIMessage[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  hintStream: { text: string; isLoading: boolean };
  onHintRequest: (level: number) => void;
  hintLevel: number;
  onAskAboutFailure?: () => void;
  showFailureButton?: boolean;
}

function extractTextFromMessage(msg: UIMessage): string {
  if (!msg.parts) return '';
  return msg.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('');
}

export function CoachingPanel({
  mode,
  messages,
  onSendMessage,
  isLoading,
  hintStream,
  onHintRequest,
  hintLevel,
  onAskAboutFailure,
  showFailureButton,
}: CoachingPanelProps) {
  const [input, setInput] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = getSophiaConfig(mode);
  const canChat = mode === 'COACH_ME' || mode === 'MOCK_INTERVIEW';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, hintStream.text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSendMessage(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const nextHintLevel = Math.min(hintLevel + 1, 3);
  const canGetHint = hintLevel < 3 && mode !== 'MOCK_INTERVIEW';

  const statusText = hintStream.isLoading
    ? config.vocabulary.generatingHint
    : isLoading
      ? config.vocabulary.aiProcessing
      : config.vocabulary.idle;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Sophia</h3>
          <p className="text-xs" style={{ color: config.colors.text }}>
            {statusText}
          </p>
        </div>
        <span
          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
          style={{ backgroundColor: config.colors.soft, color: config.colors.primary }}
        >
          {config.label}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" aria-live="polite" aria-atomic="false">
        {messages.length === 0 && !hintStream.text ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
            <p className="text-sm text-[var(--color-text-muted)]">{config.emptyStateText}</p>
            {canGetHint && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onHintRequest(nextHintLevel)}
                disabled={!canGetHint || hintStream.isLoading}
                aria-label={`Ask Sophia for a hint level ${nextHintLevel}`}
              >
                {hintStream.isLoading
                  ? 'Getting hint...'
                  : `Ask Sophia for a hint (Level ${nextHintLevel})`}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Chat messages */}
            {messages.map((msg) => {
              const text = extractTextFromMessage(msg);
              if (!text) return null;
              const isAssistant = msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  style={{ animation: 'slideUp 0.2s ease-out' }}
                  className={cn('flex gap-2', isAssistant ? 'justify-start' : 'justify-end')}
                >
                  {isAssistant && (
                    <div className="shrink-0">
                      {!avatarError ? (
                        <div className="relative h-7 w-7 overflow-hidden rounded-full">
                          <Image
                            src={SOPHIA_AVATAR}
                            alt="Sophia"
                            fill
                            sizes="28px"
                            quality={90}
                            style={{ objectFit: 'contain' }}
                            onError={() => setAvatarError(true)}
                          />
                        </div>
                      ) : (
                        <div
                          className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
                          style={{ backgroundColor: config.colors.primary, color: '#fff' }}
                        >
                          S
                        </div>
                      )}
                    </div>
                  )}
                  <div
                    className="max-w-[80%] rounded-lg px-3 py-2 text-sm"
                    style={
                      isAssistant
                        ? { backgroundColor: config.colors.bg, color: 'var(--color-text-primary)' }
                        : undefined
                    }
                  >
                    <div
                      className="mb-1 text-xs font-medium"
                      style={
                        isAssistant
                          ? { color: config.colors.text }
                          : { color: 'var(--color-text-muted)' }
                      }
                    >
                      {isAssistant ? 'Sophia' : 'You'}
                    </div>
                    <div className="whitespace-pre-wrap">{text}</div>
                  </div>
                </div>
              );
            })}

            {/* Hint stream */}
            {hintStream.text && (
              <div className="flex gap-2">
                {!avatarError ? (
                  <div className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full">
                    <Image
                      src={SOPHIA_AVATAR}
                      alt="Sophia"
                      fill
                      sizes="28px"
                      quality={90}
                      style={{ objectFit: 'contain' }}
                      onError={() => setAvatarError(true)}
                    />
                  </div>
                ) : (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold"
                    style={{ backgroundColor: config.colors.primary, color: '#fff' }}
                  >
                    S
                  </div>
                )}
                <div
                  className="rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)]"
                  style={{ backgroundColor: config.colors.bg }}
                >
                  <div className="mb-1 text-xs font-medium" style={{ color: config.colors.text }}>
                    Hint (Level {hintLevel})
                  </div>
                  <div className="whitespace-pre-wrap">
                    {hintStream.text}
                    {hintStream.isLoading && (
                      <span
                        className="ml-1 inline-block h-3 w-3 animate-pulse rounded-full"
                        style={{ backgroundColor: config.colors.primary }}
                      />
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Loading indicator for chat */}
            {isLoading && !hintStream.isLoading && (
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <span
                  className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
                  style={{ borderColor: config.colors.primary, borderTopColor: 'transparent' }}
                />
                {config.vocabulary.aiProcessing}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              {canGetHint && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => onHintRequest(nextHintLevel)}
                  disabled={hintStream.isLoading || isLoading}
                  aria-label={`Ask Sophia for a hint level ${nextHintLevel}`}
                >
                  Ask Sophia for a hint (Level {nextHintLevel})
                </Button>
              )}
              {showFailureButton && onAskAboutFailure && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onAskAboutFailure}
                  disabled={isLoading}
                  aria-label="Ask Sophia why tests failed"
                  className="border-[var(--color-error)]/30 text-[var(--color-error)] hover:bg-[var(--color-error)]/10"
                >
                  Why did this fail?
                </Button>
              )}
            </div>

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--color-border)] p-3">
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2"
        >
          <label htmlFor="coach-input" className="sr-only">
            Ask Sophia a question
          </label>
          <input
            ref={inputRef}
            id="coach-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!canChat || isLoading}
            aria-label="Ask Sophia a question"
            placeholder={
              !canChat
                ? 'Use hints to get guidance'
                : isLoading
                  ? 'Waiting for response...'
                  : 'Ask Sophia...'
            }
            className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={!canChat || !input.trim() || isLoading}
            aria-label="Send message"
            className="text-xs text-[var(--color-accent)] disabled:text-[var(--color-text-muted)]"
          >
            ⌘↵
          </button>
        </form>
      </div>
    </div>
  );
}

export default CoachingPanel;
