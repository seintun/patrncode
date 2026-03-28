'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useEffect, useState, useMemo, useLayoutEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-[var(--color-bg-primary)]">
      <Skeleton className="h-full w-full" />
    </div>
  ),
});

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
}

export function CodeEditor({ value, onChange, language = 'python' }: CodeEditorProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);
  const editorRef = useRef<any>(null);
  const [mounted, setMounted] = useState(false);
  const isMobile = mounted && window.innerWidth < 768;

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

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    editorRef.current = editor;

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
      automaticLayout: true,
      renderLineHighlight: 'line' as const,
      cursorBlinking: 'smooth' as const,
      cursorSmoothCaretAnimation: 'on' as const,
      smoothScrolling: true,
      lineNumbers: (isMobile ? 'off' : 'on') as 'on' | 'off',
      folding: !isMobile,
      accessibilitySupport: 'on' as const,
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
    <div aria-label="Code editor" className="relative h-full w-full">
      <div className="absolute inset-0">
        <MonacoEditor
          key="monaco-editor-instance"
          height="100%"
          language={language}
          value={value}
          theme="sophocode-dark"
          onChange={handleChange}
          onMount={handleEditorDidMount}
          options={options}
        />
      </div>
    </div>
  );
}
