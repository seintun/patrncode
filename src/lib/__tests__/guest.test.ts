import { describe, it, expect, vi } from 'vitest';
import { getGuestIdFromCookie, generateGuestId } from '../guest';

type CookieLike = {
  get: (name: string) => { value: string } | undefined;
};

describe('guest lib', () => {
  describe('getGuestIdFromCookie', () => {
    it('returns the cookie value if present', () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: 'test-guest-id' }),
      };
      expect(getGuestIdFromCookie(mockCookies as CookieLike)).toBe('test-guest-id');
      expect(mockCookies.get).toHaveBeenCalledWith('sophocode_guest');
    });

    it('returns null if cookie is missing', () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue(undefined),
      };
      expect(getGuestIdFromCookie(mockCookies as CookieLike)).toBeNull();
    });
  });

  describe('generateGuestId', () => {
    it('generates a valid UUID', () => {
      const id = generateGuestId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
    });
  });
});
