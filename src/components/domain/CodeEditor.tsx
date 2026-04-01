'use client';

import MonacoEditor, { type Monaco } from '@monaco-editor/react';
import { useCallback, useRef, useEffect, useState, useMemo, useLayoutEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

type StandaloneCodeEditor = Parameters<
  NonNullable<React.ComponentProps<typeof MonacoEditor>['onMount']>
>[0];

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

// ── Hack to Ignore Harmless Monaco Cancellation Errors ───────────────────────
/**
 * Monaco (and its underlyng Promise implementation) can sometimes throw
 * "Canceled" errors when an editor is disposed or a provider is interrupted.
 * These are harmless but can trigger Next.js error overlays in development.
 */
function useMonacoCancellationHack() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    // 1. Intercept console.error to suppress "Canceled" strings
    const originalError = console.error;
    console.error = (...args: unknown[]) => {
      const isMonacoCanceledError = args.some(
        (arg) =>
          arg &&
          ((typeof arg === 'string' && arg.includes('Canceled')) ||
            (typeof arg === 'object' &&
              arg !== null &&
              ('name' in arg || 'message' in arg) &&
              ((arg as Record<string, unknown>).name === 'Canceled' ||
                (arg as Record<string, string>).message?.includes('Canceled')))),
      );

      if (isMonacoCanceledError) return;
      originalError.apply(console, args);
    };

    // 2. Intercept unhandled promise rejections for "Canceled"
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      if (
        reason &&
        (reason === 'Canceled' ||
          reason.name === 'Canceled' ||
          reason.message === 'Canceled' ||
          reason.message?.includes('Canceled'))
      ) {
        event.preventDefault(); // Stop Next.js dev overlay
      }
    };

    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      console.error = originalError;
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);
}
// ─────────────────────────────────────────────────────────────────────────────

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

export function CodeEditor({
  value,
  onChange,
  language = 'python',
  onFocus,
  onBlur,
}: CodeEditorProps) {
  useMonacoCancellationHack();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editorRef = useRef<StandaloneCodeEditor | null>(null);
  const [mounted, setMounted] = useState(false);
  const isMobile = mounted && (typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useIsomorphicLayoutEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      if (!editorRef.current) return;
      const code = newValue ?? '';
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(code);
      }, 500);
    },
    [onChange],
  );

  const handleEditorWillMount = useCallback((monaco: Monaco) => {
    // Configure Monaco to use blob workers to avoid network cancellation errors
    monaco.editor.defineTheme('sophocode-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'E8ECF4', background: '080C18' },
        { token: 'comment', foreground: '5C6578' },
        { token: 'keyword', foreground: '2DD4BF' },
        { token: 'string', foreground: '10B981' },
        { token: 'number', foreground: 'F59E0B' },
        { token: 'type', foreground: '818CF8' },
        { token: 'function', foreground: '818CF8' },
      ],
      colors: {
        'editor.background': '#080C18',
        'editor.foreground': '#E8ECF4',
        'editor.lineHighlightBackground': '#111827',
        'editor.selectionBackground': '#1C243980',
        'editorCursor.foreground': '#2DD4BF',
        'editorLineNumber.foreground': '#5C6578',
        'editorLineNumber.activeForeground': '#8B95A8',
        'editor.inactiveSelectionBackground': '#1C243940',
        'editorIndentGuide.background': '#111827',
        'editorIndentGuide.activeBackground': '#1E2A3E',
      },
    });
  }, []);

  const handleEditorDidMount = useCallback(
    (editor: StandaloneCodeEditor) => {
      editorRef.current = editor;

      editor.onDidFocusEditorWidget(() => {
        onFocus?.();
      });

      editor.onDidBlurEditorWidget(() => {
        onBlur?.();
      });

      // Force initial layout to ensure visibility
      setTimeout(() => editor.layout(), 0);
    },
    [onFocus, onBlur],
  );

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !mounted) return;

    const observer = new ResizeObserver(() => {
      if (editorRef.current) {
        editorRef.current.layout();
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [mounted]);

  const options = useMemo(
    () => ({
      fontFamily: 'var(--font-geist-mono), Geist Mono, monospace',
      fontSize: isMobile ? 16 : 14,
      lineHeight: 22,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      padding: { top: 12 },
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on' as const,
      automaticLayout: false,
      renderLineHighlight: 'line' as const,
      cursorBlinking: 'smooth' as const,
      cursorSmoothCaretAnimation: 'on' as const,
      smoothScrolling: true,
      lineNumbers: (isMobile ? 'off' : 'on') as 'on' | 'off',
      folding: !isMobile,
      accessibilitySupport: 'auto' as const,
      ariaLabel: 'Python code editor for solving the current problem',
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
    }),
    [isMobile],
  );

  if (!mounted) {
    return (
      <div className="flex h-full items-center justify-center bg-[var(--color-bg-primary)]">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  return (
    <div ref={containerRef} aria-label="Code editor" className="h-full bg-[var(--color-bg-editor)]">
      <MonacoEditor
        key="monaco-editor-instance"
        height="100%"
        language={language}
        value={value}
        theme="sophocode-dark"
        onChange={handleChange}
        beforeMount={handleEditorWillMount}
        onMount={handleEditorDidMount}
        options={options}
      />
    </div>
  );
}
