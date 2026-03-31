'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { StreamedMarkdownMessage } from '@/components/ui/StreamedMarkdownMessage';
import { HintLoader } from '@/components/ui/HintLoader';
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
  onClose?: () => void;
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
  onClose,
}: CoachingPanelProps) {
  const [input, setInput] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const config = getSophiaConfig(mode);
  const canChat = mode === 'COACH_ME' || mode === 'MOCK_INTERVIEW';

  useEffect(() => {
    // Behavior 'auto' is much less jittery than 'smooth' when updating frequently (streaming)
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
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
      <div
        data-bottomsheet-drag="true"
        className="flex items-center justify-between border-b border-[var(--color-border)] px-4 py-3 cursor-grab active:cursor-grabbing touch-none select-none"
      >
        <div className="flex items-center gap-3">
          <div
            className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full border-2"
            style={{ borderColor: config.colors.soft }}
          >
            {!avatarError ? (
              <Image
                src={SOPHIA_AVATAR}
                alt="Sophia"
                fill
                sizes="32px"
                quality={90}
                style={{ objectFit: 'contain' }}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center text-xs font-bold text-white"
                style={{ backgroundColor: config.colors.primary }}
              >
                S
              </div>
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">Sophia</h3>
            <p className="text-xs" style={{ color: config.colors.text }}>
              {statusText}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{ backgroundColor: config.colors.soft, color: config.colors.primary }}
          >
            {config.label}
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Hide Sophia coach"
              className="rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4" aria-live="polite" aria-atomic="false">
        {messages.length === 0 && !hintStream.text && !hintStream.isLoading ? (
          <div className="flex h-full flex-col items-center justify-start py-8">
            <div className="hint-cta">
              <div className="hint-cta-icon" aria-hidden="true">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2a10 10 0 1 0 10 10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              </div>

              <h3 className="explanation-cta-title">Need a nudge?</h3>
              <p className="explanation-cta-desc">
                Sophia can analyze your code and provide a progressive hint to help you get unstuck
                without giving away the full solution.
              </p>

              <div className="explanation-cta-hint">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                </svg>
                Uses AI · Progressive Levels · Typically 5-10s
              </div>

              {canGetHint && (
                <button
                  type="button"
                  onClick={() => onHintRequest(nextHintLevel)}
                  disabled={hintStream.isLoading || isLoading}
                  aria-label={`Ask Sophia for a hint level ${nextHintLevel}`}
                  className="hint-cta-btn mt-2"
                >
                  <svg
                    width="15"
                    height="15"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Get Hint (Level {nextHintLevel})
                </button>
              )}
            </div>
            {!canGetHint && (
              <p className="mt-4 text-xs text-[var(--color-text-muted)] italic">
                {mode === 'MOCK_INTERVIEW'
                  ? 'Hints are disabled in Mock Interview mode.'
                  : 'All hints for this problem have been unlocked.'}
              </p>
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
                  style={{ animation: 'slideUp 0.15s ease-out' }}
                  className={cn(
                    'flex gap-3',
                    isAssistant ? 'justify-start pl-1' : 'justify-end pr-1',
                  )}
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
                    className={cn(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                      isAssistant && 'sophia-bubble-assistant',
                    )}
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
                    {isAssistant ? (
                      <StreamedMarkdownMessage
                        content={hintStream.text}
                        accentColor={config.colors.primary}
                        isStreaming={hintStream.isLoading}
                        cursorColor={config.colors.primary}
                      />
                    ) : (
                      <div className="whitespace-pre-wrap">{text}</div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Hint stream - show if loading OR has text */}
            {(hintStream.text || hintStream.isLoading) && (
              <div className="flex gap-3 pl-1">
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
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] sophia-bubble-assistant',
                  )}
                  style={{ backgroundColor: config.colors.bg }}
                >
                  <div className="sophia-hint-badge">
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                    </svg>
                    Hint (Level {hintLevel})
                  </div>
                  {hintStream.text ? (
                    <StreamedMarkdownMessage
                      content={hintStream.text}
                      accentColor={config.colors.primary}
                      isStreaming={hintStream.isLoading}
                      cursorColor={config.colors.primary}
                    />
                  ) : (
                    <HintLoader level={hintLevel} />
                  )}
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

            <div className="flex flex-wrap justify-center gap-2 pt-2">
              {canGetHint && !hintStream.isLoading && (
                <button
                  type="button"
                  onClick={() => onHintRequest(nextHintLevel)}
                  disabled={hintStream.isLoading || isLoading}
                  aria-label={`Ask Sophia for a hint level ${nextHintLevel}`}
                  className="hint-cta-btn"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                  Request Level {nextHintLevel} Hint
                </button>
              )}
              {showFailureButton && onAskAboutFailure && (
                <button
                  type="button"
                  onClick={onAskAboutFailure}
                  disabled={isLoading}
                  aria-label="Ask Sophia why tests failed"
                  className="error-cta-btn"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  Why did this fail?
                </button>
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
            data-coach-input
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
