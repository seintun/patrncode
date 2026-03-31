import { useState, useCallback, memo, useMemo } from 'react';
import { extractChildText } from '@/lib/markdown-utils';

interface CodeBlockProps {
  children: React.ReactNode;
  lang?: string | null;
  code?: string;
  accentColor?: string;
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed; ignore
    }
  }, [code]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : 'Copy code'}
      className="sophia-copy-btn"
    >
      {copied ? (
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
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
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

export const CodeBlock = memo(function CodeBlock({
  children,
  lang,
  code,
  accentColor,
}: CodeBlockProps) {
  const accentStyle = accentColor
    ? ({ '--sophia-accent': accentColor } as React.CSSProperties)
    : undefined;

  // Use provided code string (raw stream segment) or extract from React tree
  const codeText = useMemo(() => code || extractChildText(children), [code, children]);

  return (
    <div className="sophia-pre-wrapper" style={accentStyle}>
      <div className="sophia-pre-header">
        <span className="sophia-lang-label">
          {lang || (codeText.includes('#') || codeText.includes('//') ? 'Pseudocode' : 'Logic')}
        </span>
        <CopyButton code={codeText} />
      </div>
      <pre className="sophia-pre">
        <code className={`sophia-code-inner ${lang ? `language-${lang}` : ''}`}>{children}</code>
      </pre>
    </div>
  );
});

CodeBlock.displayName = 'CodeBlock';
