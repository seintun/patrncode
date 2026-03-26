import { v4 as uuidv4 } from 'uuid';

const GUEST_ID_KEY = 'sophocode_guest_id';

export function getGuestId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(GUEST_ID_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(GUEST_ID_KEY, id);
  }
  return id;
}
