import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { generateGuestId } from '@/lib/guest';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.has('sophocode_guest')) {
    response.cookies.set('sophocode_guest', generateGuestId(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 365, // 1 year
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
