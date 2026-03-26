import { runTests, terminateWorker, type TestCase } from '../runner';

let mockWorker: {
  postMessage: ReturnType<typeof vi.fn>;
  terminate: ReturnType<typeof vi.fn>;
  onmessage: ((ev: any) => void) | null;
  onerror: ((ev: any) => void) | null;
};

beforeEach(() => {
  mockWorker = { postMessage: vi.fn(), terminate: vi.fn(), onmessage: null, onerror: null };
  vi.stubGlobal(
    'Worker',
    vi.fn(function () {
      return mockWorker;
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  terminateWorker();
});

const sampleTestCases: TestCase[] = [{ input: '1', expected: '1', isHidden: false }];

describe('runTests', () => {
  it('posts code, testCases, and timeout', async () => {
    const promise = runTests('print(1)', sampleTestCases);

    expect(mockWorker.postMessage).toHaveBeenCalledWith({
      code: 'print(1)',
      testCases: sampleTestCases,
      timeout: 5000,
    });

    mockWorker.onmessage?.({
      data: {
        results: [{ passed: true, input: '1', expected: '1', actual: '1' }],
        passed: 1,
        total: 1,
      },
    });
    await promise;
  });

  it('resolves on worker message', async () => {
    const promise = runTests('code', sampleTestCases);

    mockWorker.onmessage?.({
      data: {
        results: [{ passed: true, input: '1', expected: '1', actual: '1' }],
        passed: 1,
        total: 1,
      },
    });

    const result = await promise;
    expect(result).toEqual({
      results: [{ passed: true, input: '1', expected: '1', actual: '1' }],
      passed: 1,
      total: 1,
    });
  });

  it('rejects on worker error', async () => {
    const promise = runTests('code', sampleTestCases);

    mockWorker.onerror?.({ message: 'worker crashed' });

    await expect(promise).rejects.toThrow('worker crashed');
  });

  it('rejects when worker message contains error', async () => {
    const promise = runTests('code', sampleTestCases);

    mockWorker.onmessage?.({ data: { error: 'syntax error' } });

    await expect(promise).rejects.toThrow('syntax error');
  });
});

describe('terminateWorker', () => {
  it('nulls the worker and calls terminate', async () => {
    const promise = runTests('code', sampleTestCases);

    // Simulate message before terminate to avoid timeout
    mockWorker.onmessage?.({
      data: {
        results: [{ passed: true, input: '1', expected: '1', actual: '1' }],
        passed: 1,
        total: 1,
      },
    });
    await promise;

    terminateWorker();
    expect(mockWorker.terminate).toHaveBeenCalled();

    // Second call creates a new Worker
    const newMockWorker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      onmessage: null,
      onerror: null,
    };
    vi.stubGlobal(
      'Worker',
      vi.fn(function () {
        return newMockWorker;
      }),
    );

    const promise2 = runTests('code2', sampleTestCases);
    expect(newMockWorker.postMessage).toHaveBeenCalled();

    newMockWorker.onmessage?.({ data: { results: [], passed: 0, total: 0 } });
    await promise2;
  });
});
