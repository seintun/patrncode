import { getGuestId } from '../guest';

beforeEach(() => localStorage.clear());

describe('getGuestId', () => {
  it('returns empty string when window is undefined (SSR)', () => {
    const originalWindow = global.window;
    // @ts-expect-error intentional
    delete global.window;
    expect(getGuestId()).toBe('');
    global.window = originalWindow;
  });

  it('creates a UUID v4 and stores it in localStorage on first call', () => {
    const id = getGuestId();
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(localStorage.getItem('sophocode_guest_id')).toBe(id);
  });

  it('returns same ID on subsequent calls (idempotent)', () => {
    const first = getGuestId();
    const second = getGuestId();
    expect(second).toBe(first);
  });

  it('returns existing stored ID without overwriting', () => {
    localStorage.setItem('sophocode_guest_id', 'existing-id');
    const id = getGuestId();
    expect(id).toBe('existing-id');
  });
});
