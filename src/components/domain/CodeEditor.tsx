'use client';

import dynamic from 'next/dynamic';
import { useCallback, useRef, useEffect } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

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

function CodeEditor({ value, onChange, language = 'python' }: CodeEditorProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleChange = useCallback(
    (newValue: string | undefined) => {
      const code = newValue ?? '';
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        onChange(code);
      }, 500);
    },
    [onChange],
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <MonacoEditor
      height="100%"
      language={language}
      value={value}
      theme="sophocode-dark"
      onChange={handleChange}
      beforeMount={(monaco) => {
        monaco.editor.defineTheme('sophocode-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [
            { token: '', foreground: 'F1F5F9', background: '0F172A' },
            { token: 'comment', foreground: '64748B' },
            { token: 'keyword', foreground: '22D3EE' },
            { token: 'string', foreground: '10B981' },
            { token: 'number', foreground: 'F59E0B' },
            { token: 'type', foreground: '818CF8' },
            { token: 'function', foreground: '818CF8' },
          ],
          colors: {
            'editor.background': '#0F172A',
            'editor.foreground': '#F1F5F9',
            'editor.lineHighlightBackground': '#1E293B',
            'editor.selectionBackground': '#33415580',
            'editorCursor.foreground': '#22D3EE',
            'editorLineNumber.foreground': '#64748B',
            'editorLineNumber.activeForeground': '#94A3B8',
            'editor.inactiveSelectionBackground': '#33415540',
            'editorIndentGuide.background': '#1E293B',
            'editorIndentGuide.activeBackground': '#334155',
          },
        });
      }}
      options={{
        fontFamily: 'var(--font-jetbrains-mono), JetBrains Mono, monospace',
        fontSize: 14,
        lineHeight: 22,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        padding: { top: 12 },
        tabSize: 4,
        insertSpaces: true,
        wordWrap: 'on',
        automaticLayout: true,
        renderLineHighlight: 'line',
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        suggest: {
          showKeywords: true,
          showSnippets: true,
        },
      }}
    />
  );
}

export { CodeEditor };
export default CodeEditor;
