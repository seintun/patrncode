import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { generateGuestId, getGuestIdFromCookie } from '@/lib/guest';
import { PREMIUM_GATING_ENABLED } from '@/lib/feature-flags';

/**
 * Generate a cryptographically random nonce for CSP.
 */
function generateNonce(): string {
  return crypto.randomUUID().replace(/-/g, '');
}

export async function proxy(request: NextRequest) {
  const nonce = generateNonce();
  const requestHeaders = new Headers(request.headers);

  // CSP enforcement in production, report-only in development
  const isProd = process.env.NODE_ENV === 'production';
  const cspHeaderName = isProd ? 'Content-Security-Policy' : 'Content-Security-Policy-Report-Only';

  const cspValue = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://vercel.live https://va.vercel-scripts.com`,
    `style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net`,
    "img-src 'self' data: blob: https:",
    `connect-src 'self' https://cdn.jsdelivr.net https://api.openrouter.ai https://*.upstash.io https://openrouter.ai https://va.vercel-scripts.com ${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}`,
    "worker-src 'self' blob:",
    "font-src 'self' data:",
    "frame-src 'self' https://vercel.live",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');

  // Set CSP on forwarded request headers before updateSession() so Next.js can extract nonce during SSR.
  requestHeaders.set(cspHeaderName, cspValue);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-csp-nonce', nonce);

  // Handle Supabase session refresh
  const response = await updateSession(request, requestHeaders);

  // Also set CSP on response for browser enforcement
  response.headers.set(cspHeaderName, cspValue);
  response.headers.set('x-nonce', nonce);
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

  // Premium route gating
  const { pathname } = request.nextUrl;
  const isPremiumRoute =
    pathname.startsWith('/api/ai/generate-problem') ||
    pathname.startsWith('/api/recommendations/next') ||
    /\/api\/sessions\/[^/]+\/report$/.test(pathname);

  if (PREMIUM_GATING_ENABLED && isPremiumRoute) {
    const guestId = getGuestIdFromCookie(request.cookies);
    if (!guestId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const { prisma } = await import('@/lib/db/prisma');
    const profile = await prisma.userProfile.findUnique({ where: { guestId } });
    if (!profile || profile.tier !== 'PREMIUM') {
      return NextResponse.json(
        { error: 'premium_required', upgradeUrl: '/account/subscribe' },
        { status: 403 },
      );
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
