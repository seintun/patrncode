import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  // If Supabase isn't configured, skip auth middleware (guest mode)
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next({ request: { headers: request.headers } });
  }

  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get: (name) => request.cookies.get(name)?.value,
      set: (name, value, options) => {
        response.cookies.set({
          name,
          value,
          ...options,
        });
      },
      remove: (name) => {
        response.cookies.delete(name);
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return response;
  }

  await supabase.auth.refreshSession(session);

  return response;
}
