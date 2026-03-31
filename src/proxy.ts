import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { generateGuestId } from '@/lib/guest';

/**
 * Generate a cryptographically random nonce for CSP.
 */
function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();

  // Pass nonce to downstream via request header (readable in Server Components via headers())
  request.headers.set('x-csp-nonce', nonce);

  // First, handle Supabase session refresh
  const response = await updateSession(request);

  // Ensure nonce is also on the response headers for client-side access
  response.headers.set('x-csp-nonce', nonce);

  // Handle guest ID cookie
  if (!request.cookies.has('sophocode_guest')) {
    response.cookies.set('sophocode_guest', generateGuestId(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  // CSP enforcement in production, report-only in development
  const isProd = process.env.NODE_ENV === 'production';
  const cspHeaderName = isProd ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';

  const cspValue = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://vercel.live`,
    `style-src 'self' 'unsafe-inline'`,
    "img-src 'self' data: blob: https:",
    `connect-src 'self' https://api.openrouter.ai https://*.upstash.io https://openrouter.ai ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`,
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  response.headers.set(cspHeaderName, cspValue);

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
