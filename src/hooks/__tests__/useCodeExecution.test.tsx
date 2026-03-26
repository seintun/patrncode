import { renderHook, act } from '@testing-library/react';
import { useCodeExecution } from '../useCodeExecution';
import { runTests, terminateWorker } from '@/lib/execution/runner';

vi.mock('@/lib/execution/runner', () => ({
  runTests: vi.fn(),
  terminateWorker: vi.fn(),
}));

const mockedRunTests = vi.mocked(runTests);
const mockedTerminateWorker = vi.mocked(terminateWorker);

describe('useCodeExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('has correct initial state', () => {
    const { result } = renderHook(() => useCodeExecution());

    expect(result.current.isRunning).toBe(false);
    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('toggles isRunning during async run', async () => {
    let resolveRun!: (value: any) => void;
    mockedRunTests.mockReturnValue(new Promise((r) => (resolveRun = r)));

    const { result } = renderHook(() => useCodeExecution());

    act(() => {
      result.current.run('code', [{ input: '1', expected: '1', isHidden: false }]);
    });

    expect(result.current.isRunning).toBe(true);

    await act(async () => {
      resolveRun({
        results: [{ passed: true, input: '1', expected: '1', actual: '1' }],
        passed: 1,
        total: 1,
      });
    });

    expect(result.current.isRunning).toBe(false);
  });

  it('sets results on success', async () => {
    const runResult = {
      results: [{ passed: true, input: '1', expected: '1', actual: '1' }],
      passed: 1,
      total: 1,
    };
    mockedRunTests.mockResolvedValue(runResult);

    const { result } = renderHook(() => useCodeExecution());

    await act(async () => {
      await result.current.run('code', [{ input: '1', expected: '1', isHidden: false }]);
    });

    expect(result.current.results).toEqual(runResult);
    expect(result.current.error).toBeNull();
  });

  it('sets error on rejection', async () => {
    mockedRunTests.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() => useCodeExecution());

    await act(async () => {
      await result.current.run('code', [{ input: '1', expected: '1', isHidden: false }]);
    });

    expect(result.current.error).toBe('boom');
    expect(result.current.results).toBeNull();
  });

  it('calls terminateWorker on unmount', () => {
    const { unmount } = renderHook(() => useCodeExecution());

    unmount();

    expect(mockedTerminateWorker).toHaveBeenCalled();
  });

  it('does not set state after unmount', async () => {
    let resolveRun!: (value: any) => void;
    mockedRunTests.mockReturnValue(new Promise((r) => (resolveRun = r)));

    const { result, unmount } = renderHook(() => useCodeExecution());

    act(() => {
      result.current.run('code', [{ input: '1', expected: '1', isHidden: false }]);
    });

    unmount();

    await act(async () => {
      resolveRun({ results: [], passed: 0, total: 0 });
    });

    // State should remain at initial values since component unmounted
    expect(result.current.results).toBeNull();
    expect(result.current.error).toBeNull();
    // isRunning stays true because setIsRunning(false) in finally is skipped after unmount
    expect(result.current.isRunning).toBe(true);
  });
});
