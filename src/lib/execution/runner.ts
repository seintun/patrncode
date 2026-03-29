export interface TestCase {
  input: string;
  expected: string;
  isHidden: boolean;
}

export interface TestResult {
  passed: boolean;
  input: string;
  expected: string;
  actual: string;
  error?: string;
}

export interface RunResult {
  results: TestResult[];
  passed: number;
  total: number;
}

let worker: Worker | null = null;

function getWorker(): Worker {
  if (!worker) {
    worker = new Worker('/pyodide-worker.js');
  }
  return worker;
}

export function runTests(
  code: string,
  testCases: TestCase[],
  functionName?: string | null,
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const w = getWorker();

    const timeoutId = setTimeout(
      () => {
        w.terminate();
        worker = null;
        reject(new Error('Pyodide worker timed out'));
      },
      testCases.length * 6000 + 10000,
    ); // Extra buffer beyond per-test timeouts

    w.onmessage = (event) => {
      clearTimeout(timeoutId);
      const data = event.data;

      if (data.error) {
        reject(new Error(data.error));
        return;
      }

      const results: TestResult[] = data.results;
      const passed = results.filter((r) => r.passed).length;

      resolve({
        results,
        passed,
        total: testCases.length,
      });
    };

    w.onerror = (err) => {
      clearTimeout(timeoutId);
      reject(new Error(err.message || 'Worker error'));
    };

    w.postMessage({ code, testCases, functionName, timeout: 5000 });
  });
}

export function prewarmWorker(): void {
  const w = getWorker();
  // Trigger worker initialization + Pyodide load without running code
  w.postMessage({ prewarm: true });
}

export function terminateWorker(): void {
  if (worker) {
    worker.terminate();
    worker = null;
  }
}
