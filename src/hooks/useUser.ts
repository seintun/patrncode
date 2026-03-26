'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function useUser() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));

    return () => subscription.unsubscribe();
  }, []);

  return user;
}
