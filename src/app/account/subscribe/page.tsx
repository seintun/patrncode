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
    <div
      className="min-h-screen flex flex-col items-center px-4 py-12"
      style={{ backgroundColor: 'var(--color-bg-primary)' }}
    >
      <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>
        Upgrade to SophoCode Premium
      </h1>
      <p className="text-base mb-8" style={{ color: 'var(--color-text-secondary)' }}>
        Unlock the full potential of your practice
      </p>

      {success && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
            color: 'var(--color-success)',
            border: '1px solid color-mix(in srgb, var(--color-success) 30%, transparent)',
          }}
        >
          Upgrade successful! You are now on the Premium plan.
        </div>
      )}

      {error && (
        <div
          className="mb-6 rounded-lg px-4 py-3 text-sm font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-error) 15%, transparent)',
            color: 'var(--color-error)',
            border: '1px solid color-mix(in srgb, var(--color-error) 30%, transparent)',
          }}
        >
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
        {/* Free Plan */}
        <Card className="flex flex-col p-6">
          <div className="mb-4">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Free
            </span>
            <h2 className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
              $0
              <span
                className="text-sm font-normal"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                /mo
              </span>
            </h2>
          </div>

          <hr className="mb-4" style={{ borderColor: 'var(--color-border)' }} />

          <ul className="flex-1 space-y-3 mb-6">
            {freeFeatures.map((f) => (
              <li key={f.text} className="flex items-start gap-2 text-sm">
                <span
                  style={{ color: f.included ? 'var(--color-success)' : 'var(--color-text-muted)' }}
                >
                  {f.included ? '✓' : '○'}
                </span>
                <span
                  style={{
                    color: f.included ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                  }}
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
        <Card
          className="flex flex-col p-6"
          style={{
            borderColor: 'var(--color-accent)',
            borderWidth: '2px',
          }}
        >
          <div className="mb-4">
            <span
              className="text-xs font-bold uppercase tracking-wider"
              style={{ color: 'var(--color-accent)' }}
            >
              Premium
            </span>
            <h2 className="text-2xl font-bold mt-1" style={{ color: 'var(--color-text-primary)' }}>
              $9
              <span
                className="text-sm font-normal"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                /mo
              </span>
            </h2>
          </div>

          <hr className="mb-4" style={{ borderColor: 'var(--color-border)' }} />

          <ul className="flex-1 space-y-3 mb-6">
            {premiumFeatures.map((f) => (
              <li key={f.text} className="flex items-start gap-2 text-sm">
                <span style={{ color: 'var(--color-success)' }}>✓</span>
                <span style={{ color: 'var(--color-text-primary)' }}>{f.text}</span>
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

      <p className="mt-8 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        Billing is managed externally. This is a mock upgrade for now.
      </p>

      <Link
        href="/dashboard"
        className="mt-4 text-sm underline"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Back to Dashboard
      </Link>
    </div>
  );
}
