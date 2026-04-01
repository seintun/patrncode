'use client';

import { useState, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import type { SessionMode } from '@/generated/prisma/enums';

interface ProblemContext {
  title: string;
  statement: string;
  pattern: string;
  difficulty: string;
}

interface StreamedContent {
  text: string;
  isLoading: boolean;
}

interface UseAIChatOptions {
  mode: SessionMode;
  problem: ProblemContext;
  currentCode?: string;
  testResults?: { passed: number; total: number };
  sessionId?: string;
}

async function* readSseStream(response: Response) {
  const reader = response.body?.getReader();
  if (!reader) return;

  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6).trim();
        if (data === '[DONE]') return;
        try {
          yield JSON.parse(data) as { type: string; delta?: string; text?: string };
        } catch (err) {
          console.error('[useAIChat] Failed to parse SSE data chunk:', { data, error: err });
          // Skip unparseable lines
        }
      }
    }
  }
}

function extractTextFromSse(
  response: Response,
  onUpdate: (text: string) => void,
  context: string,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    let fullText = '';

    try {
      for await (const chunk of readSseStream(response)) {
        if (chunk.type === 'text-delta' && chunk.delta) {
          fullText += chunk.delta;
          onUpdate(fullText);
        } else if (chunk.type === 'text-start' && chunk.text) {
          fullText = chunk.text;
          onUpdate(fullText);
        }
      }
      resolve(fullText);
    } catch (err) {
      console.error(`[useAIChat] Error in ${context} SSE stream:`, err);
      reject(err);
    }
  });
}

export function useAIChat({
  mode,
  problem,
  currentCode,
  testResults,
  sessionId,
}: UseAIChatOptions) {
  const chatMode = mode === 'MOCK_INTERVIEW' ? 'interviewer' : 'coach';

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/ai/chat',
      body: {
        mode: chatMode,
        sessionMode: mode,
        sessionId,
        currentCode,
        ...problem,
      },
    }),
    onError: (err) => {
      console.error('[useAIChat] Chat request failed:', err);
    },
  });

  const [hintStream, setHintStream] = useState<StreamedContent>({ text: '', isLoading: false });
  const [explanationStream, setExplanationStream] = useState<StreamedContent>({
    text: '',
    isLoading: false,
  });

  const isLoading = status === 'streaming' || status === 'submitted';

  const sendChat = useCallback(
    async (message: string) => {
      if (!message.trim()) return;
      sendMessage({ text: message });
    },
    [sendMessage],
  );

  const getHint = useCallback(
    async (level: number, codeOverride?: string): Promise<string> => {
      setHintStream({ text: '', isLoading: true });
      const codeToUse = codeOverride ?? (currentCode || '');

      try {
        const res = await fetch('/api/ai/hint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: problem.title,
            statement: problem.statement,
            pattern: problem.pattern,
            currentCode: codeToUse,
            testResults,
            level,
            mode,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          const errorMsg = `Server returned ${res.status}: ${text || 'Unknown error'}`;
          console.error('[useAIChat] getHint API failure:', errorMsg);
          setHintStream({
            text: "Sorry, I couldn't generate a hint right now. Please try again.",
            isLoading: false,
          });
          return '';
        }

        if (!res.body) {
          console.error('[useAIChat] getHint: empty response body');
          setHintStream({ text: 'No response received from the AI coach.', isLoading: false });
          return '';
        }

        const fullText = await extractTextFromSse(
          res,
          (text) => {
            setHintStream({ text, isLoading: true });
          },
          'getHint',
        );

        setHintStream({ text: fullText, isLoading: false });

        // Append the completed hint to the persistent message history
        setMessages((prev) => [
          ...prev,
          {
            id: `hint-${level}-${Date.now()}`,
            role: 'assistant',
            content: fullText,
            parts: [{ type: 'text', text: fullText }],
            annotations: [{ type: 'hint', level }],
          } as any, // Cast to any to bypass strict SDK part vs content typing conflicts
        ]);

        return fullText;
      } catch (err) {
        console.error('[useAIChat] getHint exception:', err);
        const errorMsg = 'An unexpected error occurred while fetching your hint.';
        setHintStream({ text: errorMsg, isLoading: false });
        return '';
      }
    },
    [problem, currentCode, testResults, mode, setMessages],
  );

  const getExplanation = useCallback(async () => {
    setExplanationStream({ text: '', isLoading: true });

    try {
      const res = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: problem.title,
          statement: problem.statement,
          pattern: problem.pattern,
          difficulty: problem.difficulty,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('[useAIChat] getExplanation API failure:', { status: res.status, text });
        setExplanationStream({
          text: 'Failed to generate explanation. Please try again.',
          isLoading: false,
        });
        return;
      }

      if (!res.body) {
        console.error('[useAIChat] getExplanation: empty response body');
        setExplanationStream({ text: 'No response received.', isLoading: false });
        return;
      }

      const fullText = await extractTextFromSse(
        res,
        (text) => {
          setExplanationStream({ text, isLoading: true });
        },
        'getExplanation',
      );

      setExplanationStream({ text: fullText, isLoading: false });
    } catch (err) {
      console.error('[useAIChat] getExplanation exception:', err);
      setExplanationStream({ text: 'An unexpected error occurred.', isLoading: false });
    }
  }, [problem]);

  const askAboutFailure = useCallback(
    async (failedResults: string) => {
      const contextMessage = `My code failed some tests. Here are the results:\n\n${failedResults}\n\nCan you help me understand why these tests failed and what I should fix?`;
      await sendChat(contextMessage);
    },
    [sendChat],
  );

  return {
    messages,
    sendChat,
    isLoading,
    stop,
    setMessages,
    status,
    hintStream,
    getHint,
    explanationStream,
    getExplanation,
    askAboutFailure,
  };
}
