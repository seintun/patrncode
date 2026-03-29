'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { SOPHIA_AVATAR, SOPHIA_MODES } from '@/lib/sophia';
import type { SessionMode } from '@/lib/sophia';

interface FloatingSophiaProps {
  currentMessage: string | null;
  isDimmed: boolean;
  isCoachOpen: boolean;
  mode: SessionMode;
  onClick: () => void;
  onDismiss: () => void;
}

const CHAR_DELAY_MS = 30;
const AUTO_DISMISS_MS = 7_000;

export function FloatingSophia({
  currentMessage,
  isDimmed,
  isCoachOpen,
  mode,
  onClick,
  onDismiss,
}: FloatingSophiaProps) {
  const [avatarError, setAvatarError] = useState(false);
  const [displayed, setDisplayed] = useState('');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const config = SOPHIA_MODES[mode] ?? SOPHIA_MODES.SELF_PRACTICE;

  // Typewriter effect for bubble text
  useEffect(() => {
    if (!currentMessage) {
      setDisplayed('');
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    setDisplayed('');
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayed(currentMessage.slice(0, i));
      if (i >= currentMessage.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, CHAR_DELAY_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentMessage]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!currentMessage) {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
      return;
    }

    dismissTimerRef.current = setTimeout(() => {
      onDismiss();
    }, AUTO_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [currentMessage, onDismiss]);

  const skipTypewriter = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (currentMessage) {
      setDisplayed(currentMessage);
    }
  }, [currentMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onDismiss();
      }
    },
    [onClick, onDismiss],
  );

  const handleBubbleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      skipTypewriter();
    },
    [skipTypewriter],
  );

  // Don't render when coach is fully open (plan: isVisible=false when coach open)
  if (isCoachOpen) return null;

  return (
    <div
      className="fixed bottom-4 left-4 z-40 md:bottom-4 bottom-20"
      style={{ opacity: isDimmed ? 0.3 : 0.8 }}
    >
      <div className="flex items-end gap-2">
        {/* Avatar circle */}
        <button
          type="button"
          role="button"
          tabIndex={0}
          aria-label="Open Sophia coach"
          onClick={onClick}
          onKeyDown={handleKeyDown}
          className="shrink-0 rounded-full transition-opacity duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] hover:opacity-100"
          style={{ opacity: isDimmed ? 0.3 : 0.8 }}
        >
          {!avatarError ? (
            <div
              className="relative h-10 w-10 overflow-hidden rounded-full"
              style={{ animation: currentMessage ? 'none' : 'glow 3s ease-in-out infinite' }}
            >
              <Image
                src={SOPHIA_AVATAR}
                alt="Sophia"
                fill
                sizes="40px"
                quality={90}
                style={{ objectFit: 'contain' }}
                onError={() => setAvatarError(true)}
              />
            </div>
          ) : (
            <div
              className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
              style={{ backgroundColor: config.colors.primary }}
            >
              S
            </div>
          )}
        </button>

        {/* Speech bubble */}
        {currentMessage && (
          <div className="relative max-w-[200px]" style={{ animation: 'fadeIn 0.2s ease-out' }}>
            {/* Tail pointing left */}
            <div
              className="absolute -left-1.5 bottom-2.5 h-0 w-0"
              style={{
                borderTop: '5px solid transparent',
                borderBottom: '5px solid transparent',
                borderRight: `6px solid ${config.colors.primary}`,
              }}
            />
            <div
              role="region"
              aria-live="polite"
              aria-label="Sophia says"
              onClick={handleBubbleClick}
              className="relative cursor-pointer rounded-lg px-3 py-2 text-xs leading-relaxed"
              style={{
                backgroundColor: config.colors.bg,
                borderLeft: `2px solid ${config.colors.primary}`,
              }}
            >
              {/* Invisible full text reserves height */}
              <span aria-hidden="true" className="invisible select-none">
                {currentMessage}
              </span>
              <span
                className="absolute inset-0 px-3 py-2 text-xs leading-relaxed"
                style={{ color: config.colors.text }}
              >
                {displayed}
                {displayed.length < currentMessage.length && (
                  <span
                    className="ml-0.5 inline-block h-2.5 w-0.5 animate-pulse"
                    style={{ backgroundColor: config.colors.primary }}
                    aria-hidden="true"
                  />
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default FloatingSophia;
