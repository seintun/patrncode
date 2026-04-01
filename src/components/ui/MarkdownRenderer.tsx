'use client';

import { useMemo, memo } from 'react';
import type { CSSProperties } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import { CodeBlock } from './CodeBlock';
import { extractChildText } from '@/lib/markdown-utils';

interface MarkdownRendererProps {
  content: string;
  accentColor?: string;
  compact?: boolean;
  className?: string;
}

/**
 * Pure markdown renderer with memoized component mappings.
 * Handles all markdown elements except code blocks which are delegated to CodeBlock.
 */
export const MarkdownRenderer = memo(function MarkdownRenderer({
  content,
  accentColor,
  compact = false,
  className = '',
}: MarkdownRendererProps) {
  const accentStyle = accentColor
    ? ({ '--sophia-accent': accentColor } as CSSProperties)
    : undefined;

  const components = useMemo<Components>(
    () => ({
      code({ children, className: codeClass }) {
        const codeText = extractChildText(children);
        const hasNewlines = codeText.includes('\n');
        const isBlock =
          (typeof codeClass === 'string' && codeClass.startsWith('language-')) || hasNewlines;

        if (isBlock) {
          const lang =
            typeof codeClass === 'string'
              ? codeClass.replace('language-', '').split(' ')[0]
              : undefined;
          return (
            <CodeBlock lang={lang} code={codeText} accentColor={accentColor}>
              {children}
            </CodeBlock>
          );
        }
        return <code className="sophia-inline-code">{children}</code>;
      },

      p({ children }) {
        if (compact) return <span className="sophia-p-compact">{children}</span>;
        return <p className="sophia-p">{children}</p>;
      },

      ul({ children }) {
        return <ul className={compact ? 'sophia-ul-compact' : 'sophia-ul'}>{children}</ul>;
      },
      ol({ children }) {
        return <ol className={compact ? 'sophia-ol-compact' : 'sophia-ol'}>{children}</ol>;
      },
      li({ children }) {
        return <li className={compact ? 'sophia-li-compact' : 'sophia-li'}>{children}</li>;
      },

      blockquote({ children }) {
        if (compact) return <>{children}</>;
        return <blockquote className="sophia-blockquote">{children}</blockquote>;
      },

      hr() {
        return <hr className="sophia-hr" />;
      },

      h1({ children }) {
        return <h1 className="sophia-h1">{children}</h1>;
      },
      h2({ children }) {
        return <h2 className="sophia-h2">{children}</h2>;
      },
      h3({ children }) {
        return <h3 className="sophia-h3">{children}</h3>;
      },
      h4({ children }) {
        return <h4 className="sophia-h4">{children}</h4>;
      },

      strong({ children }) {
        return <strong className="sophia-strong">{children}</strong>;
      },
      em({ children }) {
        return <em className="sophia-em">{children}</em>;
      },
    }),
    [accentColor, compact],
  );

  return (
    <div className={`sophia-prose ${className}`} style={accentStyle}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  );
});

MarkdownRenderer.displayName = 'MarkdownRenderer';
