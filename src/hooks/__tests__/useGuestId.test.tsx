import { renderHook } from '@testing-library/react';
import { useGuestId } from '../useGuestId';
import { getGuestId } from '@/lib/guest';

vi.mock('@/lib/guest', () => ({
  getGuestId: vi.fn(),
}));

const mockedGetGuestId = vi.mocked(getGuestId);

describe('useGuestId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getGuestId via effect and returns its value', () => {
    mockedGetGuestId.mockReturnValue('abc-123');
    const { result } = renderHook(() => useGuestId());
    expect(mockedGetGuestId).toHaveBeenCalledTimes(1);
    expect(result.current).toBe('abc-123');
  });

  it('returns empty string when getGuestId returns empty', () => {
    mockedGetGuestId.mockReturnValue('');
    const { result } = renderHook(() => useGuestId());
    expect(result.current).toBe('');
  });

  it('returns the same ID across calls', () => {
    mockedGetGuestId.mockReturnValue('stable-id');
    const { result: r1 } = renderHook(() => useGuestId());
    expect(r1.current).toBe('stable-id');

    const { result: r2 } = renderHook(() => useGuestId());
    expect(r2.current).toBe('stable-id');
  });
});
