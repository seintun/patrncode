'use client';

import { memo } from 'react';
import dynamic from 'next/dynamic';

const MarkdownRenderer = dynamic(
  () => import('./MarkdownRenderer').then((mod) => ({ default: mod.MarkdownRenderer })),
  {
    loading: () => (
      <div className="animate-pulse space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
      </div>
    ),
  },
);

interface StreamedMarkdownMessageProps {
  content: string;
  accentColor?: string;
  compact?: boolean;
  isStreaming?: boolean;
  cursorColor?: string;
  className?: string;
}

/**
 * Wrapper around MarkdownRenderer that adds a streaming cursor when content is being streamed.
 * Fully memoized to prevent unnecessary re-renders during streaming.
 */
export const StreamedMarkdownMessage = memo(function StreamedMarkdownMessage({
  content,
  accentColor,
  compact = false,
  isStreaming = false,
  cursorColor,
  className = '',
}: StreamedMarkdownMessageProps) {
  const cursorStyle = cursorColor ? { backgroundColor: cursorColor } : undefined;

  return (
    <div className={className}>
      <MarkdownRenderer content={content} accentColor={accentColor} compact={compact} />
      {isStreaming && <span className="sophia-cursor" style={cursorStyle} aria-hidden="true" />}
    </div>
  );
});

StreamedMarkdownMessage.displayName = 'StreamedMarkdownMessage';
