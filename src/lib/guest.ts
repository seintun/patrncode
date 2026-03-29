const GUEST_COOKIE = 'sophocode_guest';

export function getGuestIdFromCookie(cookies: {
  get: (name: string) => { value: string } | undefined;
}): string | null {
  return cookies.get(GUEST_COOKIE)?.value ?? null;
}

export function generateGuestId(): string {
  return crypto.randomUUID();
}
