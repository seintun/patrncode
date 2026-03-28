'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { runTests, terminateWorker, type TestCase, type RunResult } from '@/lib/execution/runner';

export { type TestCase, type RunResult } from '@/lib/execution/runner';

export function useCodeExecution() {
  const [results, setResults] = useState<RunResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      terminateWorker();
    };
  }, []);

  const run = useCallback(
    async (code: string, testCases: TestCase[], functionName?: string | null) => {
      setIsRunning(true);
      setError(null);
      setResults(null);

      try {
        const result = await runTests(code, testCases, functionName);
        if (mountedRef.current) {
          setResults(result);
        }
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An unexpected error occurred during execution';
        console.error('[useCodeExecution] Execution failed:', {
          error: err,
          codeLength: code.length,
          testCasesCount: testCases.length,
        });

        if (mountedRef.current) {
          setError(errorMessage);
        }
        throw err;
      } finally {
        if (mountedRef.current) {
          setIsRunning(false);
        }
      }
    },
    [],
  );

  return { run, results, isRunning, error };
}
