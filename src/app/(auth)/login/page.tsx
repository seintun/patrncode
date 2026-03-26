'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signInWithGithub() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function signInWithGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <h1 className="mb-1 text-2xl font-bold text-[var(--color-text-primary)]">
          Sign in to patrncode
        </h1>
        <p className="mb-6 text-sm text-[var(--color-text-secondary)]">
          Save your progress and sync across devices.
        </p>

        <div className="space-y-3">
          <Button variant="secondary" className="w-full" onClick={signInWithGithub}>
            Continue with GitHub
          </Button>
          <Button variant="secondary" className="w-full" onClick={signInWithGoogle}>
            Continue with Google
          </Button>
        </div>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-muted)]">or</span>
          <div className="h-px flex-1 bg-[var(--color-border)]" />
        </div>

        {sent ? (
          <p className="text-center text-sm text-[var(--color-success)]">
            Check your email for a magic link.
          </p>
        ) : (
          <form onSubmit={signInWithMagicLink} className="space-y-3">
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-4 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            />
            {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Sending...' : 'Send magic link'}
            </Button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/practice"
            className="text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]"
          >
            Continue as guest
          </Link>
        </div>
      </Card>
    </div>
  );
}
