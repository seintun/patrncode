import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { generateGuestId } from '@/lib/guest';

export async function proxy(request: NextRequest) {
  // First, handle Supabase session refresh
  const response = await updateSession(request);

  // Then, handle our guest ID cookie
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
