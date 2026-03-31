'use client';

import { useEffect, useState } from 'react';

const HINT_LOADING_MESSAGES = [
  'Analyzing your code…',
  'Finding the key insight…',
  'Crafting a helpful nudge…',
  'Almost there…',
];

interface HintLoaderProps {
  level: number;
  className?: string;
}

export function HintLoader({ level, className = '' }: HintLoaderProps) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setMsgIndex((i) => (i + 1) % HINT_LOADING_MESSAGES.length);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={`explanation-loader hint-loader ${className}`}
      aria-live="polite"
      aria-label="Generating hint"
    >
      <div className="explanation-loader-avatar">
        <span className="explanation-loader-ring" />
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="explanation-loader-icon"
        >
          <path d="M12 2a10 10 0 1 0 10 10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </div>

      <p key={msgIndex} className="explanation-loader-msg">
        {HINT_LOADING_MESSAGES[msgIndex]}
      </p>

      <div className="explanation-loader-skeleton">
        <div className="explanation-loader-gap" />
        {[85, 92, 60].map((w, i) => (
          <div
            key={i}
            className="explanation-loader-line"
            style={{ width: `${w}%`, animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>

      <div className="explanation-cta-hint mt-3 opacity-80" style={{ fontSize: '0.65rem' }}>
        <svg
          width="10"
          height="10"
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
        Hint Level {level} · Uses AI · 5–10s
      </div>
    </div>
  );
}
