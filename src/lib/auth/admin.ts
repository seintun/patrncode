import { NextResponse } from 'next/server';

/**
 * Validates the x-admin-secret header.
 * Returns a Response if auth fails, or null if allowed.
 */
export function requireAdminSecret(request: Request): Response | null {
  const adminSecret = process.env.ADMIN_SECRET;
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    if (!adminSecret) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    if (request.headers.get('x-admin-secret') !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  } else if (adminSecret) {
    if (request.headers.get('x-admin-secret') !== adminSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  return null;
}
