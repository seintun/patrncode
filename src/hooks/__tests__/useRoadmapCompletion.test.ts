import { renderHook, act } from '@testing-library/react';
import { useRoadmapCompletion } from '../useRoadmapCompletion';

const mockConfetti = vi.fn();
vi.mock('canvas-confetti', () => ({ default: mockConfetti }));

describe('useRoadmapCompletion', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('does not fire confetti when fewer than 75 problems mastered', async () => {
    const problems = Array.from({ length: 74 }, () => ({ mastery: 'MASTERED' }));
    await act(async () => {
      renderHook(() => useRoadmapCompletion(problems));
    });
    expect(mockConfetti).not.toHaveBeenCalled();
  });

  it('does not fire confetti when problems array is empty', async () => {
    await act(async () => {
      renderHook(() => useRoadmapCompletion([]));
    });
    expect(mockConfetti).not.toHaveBeenCalled();
  });

  it('fires confetti when 75 problems are mastered and key is absent', async () => {
    const problems = Array.from({ length: 75 }, () => ({ mastery: 'MASTERED' }));
    await act(async () => {
      renderHook(() => useRoadmapCompletion(problems));
    });
    expect(mockConfetti).toHaveBeenCalledWith(
      expect.objectContaining({ particleCount: 150, spread: 100 }),
    );
    expect(localStorage.getItem('sopho75_confetti_shown')).toBe('true');
  });

  it('does not fire confetti when localStorage key already set', async () => {
    localStorage.setItem('sopho75_confetti_shown', 'true');
    const problems = Array.from({ length: 75 }, () => ({ mastery: 'MASTERED' }));
    await act(async () => {
      renderHook(() => useRoadmapCompletion(problems));
    });
    expect(mockConfetti).not.toHaveBeenCalled();
  });

  it('fires with exactly 75 mastered even when total > 75', async () => {
    const problems = Array.from({ length: 80 }, () => ({ mastery: 'MASTERED' }));
    await act(async () => {
      renderHook(() => useRoadmapCompletion(problems));
    });
    expect(mockConfetti).toHaveBeenCalledTimes(1);
  });

  it('hasFired.current prevents double-fire on re-render', async () => {
    const problems = Array.from({ length: 75 }, () => ({ mastery: 'MASTERED' }));
    const { rerender } = renderHook(() => useRoadmapCompletion(problems));
    await act(async () => {});
    // Remove localStorage guard so only hasFired.current guards second fire
    localStorage.removeItem('sopho75_confetti_shown');
    act(() => rerender());
    await act(async () => {});
    expect(mockConfetti).toHaveBeenCalledTimes(1);
  });
});
