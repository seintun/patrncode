'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { SOPHIA_AVATAR, SOPHIA_MODES } from '@/lib/sophia';

const { colors } = SOPHIA_MODES.SELF_PRACTICE;
const CHAR_DELAY_MS = 30;

interface SophiaBubbleProps {
  text: string;
  stepKey: number | string;
}

export function SophiaBubble({ text, stepKey }: SophiaBubbleProps) {
  const [displayed, setDisplayed] = useState('');
  const [avatarError, setAvatarError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }, CHAR_DELAY_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [text, stepKey]);

  const skip = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setDisplayed(text);
  }, [text]);

  return (
    <div className="mb-6 flex items-start gap-3">
      {/* Avatar */}
      <div className="shrink-0">
        {!avatarError ? (
          <div className="relative h-7 w-7 overflow-hidden rounded-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={SOPHIA_AVATAR}
              alt="Sophia"
              className="h-full w-full object-contain"
              onError={() => setAvatarError(true)}
            />
          </div>
        ) : (
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: colors.primary, color: '#fff' }}
          >
            S
          </div>
        )}
      </div>

      {/* Bubble with left-pointing tail */}
      <div className="relative">
        <div
          className="absolute -left-2 top-3 h-0 w-0"
          style={{
            borderTop: '6px solid transparent',
            borderBottom: '6px solid transparent',
            borderRight: `8px solid ${colors.primary}`,
          }}
        />
        {/* Invisible full text reserves the exact final height — no layout shift */}
        <div
          role="region"
          aria-live="polite"
          aria-label="Sophia says"
          tabIndex={0}
          onClick={skip}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              skip();
            }
          }}
          className="relative cursor-pointer rounded-lg px-4 py-3 text-sm leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]/50"
          style={{
            backgroundColor: colors.bg,
            borderLeft: `2px solid ${colors.primary}`,
          }}
        >
          <span aria-hidden="true" className="invisible select-none">
            {text}
          </span>
          <span
            data-testid="sophia-displayed"
            className="absolute inset-0 px-4 py-3 text-sm leading-relaxed"
            style={{ color: colors.text }}
          >
            {displayed}
            {displayed.length < text.length && (
              <span
                className="ml-0.5 inline-block h-3 w-0.5 animate-pulse"
                style={{ backgroundColor: colors.primary }}
                aria-hidden="true"
              />
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
