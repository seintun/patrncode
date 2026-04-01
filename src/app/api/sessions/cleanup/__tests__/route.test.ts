/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { POST } from '../route';
import { cleanupExpiredSessions } from '@/lib/session/expiry';

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

vi.mock('@/lib/session/expiry', () => ({
  cleanupExpiredSessions: vi.fn(),
}));

const mockGuestId = 'test-guest-id';

describe('POST /api/sessions/cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: mockGuestId }),
    } as any);
  });

  it('returns cleanup counts and calls cleanup with guestId', async () => {
    vi.mocked(cleanupExpiredSessions).mockResolvedValue({
      expiredCount: 2,
      abandonedCount: 2,
      resetMasteryCount: 1,
    });

    const req = new NextRequest('http://localhost/api/sessions/cleanup', {
      method: 'POST',
    });

    const response = await POST(req);

    expect(response.status).toBe(200);
    expect(cleanupExpiredSessions).toHaveBeenCalledWith(mockGuestId);
    await expect(response.json()).resolves.toEqual({
      expiredCount: 2,
      abandonedCount: 2,
      resetMasteryCount: 1,
    });
  });

  it('returns 401 when guest cookie is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const req = new NextRequest('http://localhost/api/sessions/cleanup', {
      method: 'POST',
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
    expect(cleanupExpiredSessions).not.toHaveBeenCalled();
  });
});
