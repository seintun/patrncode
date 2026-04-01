'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

interface PlanFeature {
  text: string;
  included: boolean;
}

const freeFeatures: PlanFeature[] = [
  { text: '75 curated problems', included: true },
  { text: 'Basic AI coach', included: true },
  { text: 'Streak tracking', included: true },
  { text: 'Daily challenge', included: true },
  { text: 'Haiku AI model', included: false },
];

const premiumFeatures: PlanFeature[] = [
  { text: 'Everything in Free', included: true },
  { text: 'Advanced AI coach', included: true },
  { text: 'Custom problems', included: true },
  { text: 'Session reports', included: true },
  { text: 'Sonnet AI model', included: true },
  { text: 'Priority support', included: true },
];

export default function SubscribePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleUpgrade() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/upgrade-tier', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Upgrade failed');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 bg-[var(--color-bg-primary)]">
      <h1 className="text-3xl font-bold mb-2 text-[var(--color-text-primary)]">
        Upgrade to SophoCode Premium
      </h1>
      <p className="text-base mb-8 text-[var(--color-text-secondary)]">
        Unlock the full potential of your practice
      </p>

      {success && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm font-medium bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)] border border-[color-mix(in_srgb,var(--color-success)_30%,transparent)]">
          Upgrade successful! You are now on the Premium plan.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-lg px-4 py-3 text-sm font-medium bg-[color-mix(in_srgb,var(--color-error)_15%,transparent)] text-[var(--color-error)] border border-[color-mix(in_srgb,var(--color-error)_30%,transparent)]">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Free Plan */}
        <Card className="flex flex-col p-6">
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
              Free
            </span>
            <h2 className="text-2xl font-bold mt-1 text-[var(--color-text-primary)]">
              $0
              <span className="text-sm font-normal text-[var(--color-text-secondary)]">/mo</span>
            </h2>
          </div>

          <hr className="mb-4 border-[var(--color-border)]" />

          <ul className="flex-1 space-y-3 mb-6">
            {freeFeatures.map((f) => (
              <li key={f.text} className="flex items-start gap-2 text-sm">
                <span
                  className={
                    f.included ? 'text-[var(--color-success)]' : 'text-[var(--color-text-muted)]'
                  }
                >
                  {f.included ? '✓' : '○'}
                </span>
                <span
                  className={
                    f.included
                      ? 'text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-muted)]'
                  }
                >
                  {f.text}
                </span>
              </li>
            ))}
          </ul>

          <Button variant="secondary" disabled className="w-full">
            Current Plan
          </Button>
        </Card>

        {/* Premium Plan */}
        <Card className="flex flex-col p-6 border-2 border-[var(--color-accent)]">
          <div className="mb-4">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--color-accent)]">
              Premium
            </span>
            <h2 className="text-2xl font-bold mt-1 text-[var(--color-text-primary)]">
              $9
              <span className="text-sm font-normal text-[var(--color-text-secondary)]">/mo</span>
            </h2>
          </div>

          <hr className="mb-4 border-[var(--color-border)]" />

          <ul className="flex-1 space-y-3 mb-6">
            {premiumFeatures.map((f) => (
              <li key={f.text} className="flex items-start gap-2 text-sm">
                <span className="text-[var(--color-success)]">✓</span>
                <span className="text-[var(--color-text-primary)]">{f.text}</span>
              </li>
            ))}
          </ul>

          <Button
            variant="primary"
            className="w-full"
            onClick={handleUpgrade}
            disabled={loading || success}
          >
            {loading ? 'Upgrading...' : success ? 'Subscribed' : 'Subscribe Now'}
          </Button>
        </Card>
      </div>

      <p className="mt-8 text-xs text-[var(--color-text-muted)]">
        Billing is managed externally. This is a mock upgrade for now.
      </p>

      <Link href="/dashboard" className="mt-4 text-sm underline text-[var(--color-text-secondary)]">
        Back to Dashboard
      </Link>
    </div>
  );
}
