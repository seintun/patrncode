import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Run guest-to-user migration
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        try {
          const { migrateGuestData } = await import('@/lib/auth/migrate');
          await migrateGuestData(user.id);
        } catch (err) {
          console.error('Guest-to-user migration failed:', err);
          // Non-blocking — user can still proceed
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
