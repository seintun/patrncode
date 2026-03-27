import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Hero */}
      <section className="mb-20 py-16 text-center">
        <div
          className="mx-auto mb-6 inline-flex items-center rounded-full border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent)]"
          style={{ animation: 'slideUp 0.4s ease-out' }}
        >
          AI-Coached Interview Prep
        </div>
        <h1
          className="mb-4 text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl"
          style={{ animation: 'slideUp 0.4s ease-out 100ms both' }}
        >
          Practice coding interviews
          <br />
          <span className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-ai-coach)] bg-clip-text text-transparent">
            with a Socratic AI coach
          </span>
        </h1>
        <p
          className="mx-auto mb-8 max-w-2xl text-lg text-[var(--color-text-secondary)]"
          style={{ animation: 'slideUp 0.4s ease-out 200ms both' }}
        >
          Learn patterns, not just problems. Get coached through Clarify → Plan → Code → Reflect.
        </p>
        <div style={{ animation: 'slideUp 0.4s ease-out 300ms both' }}>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/onboarding">
              <Button size="lg" aria-label="Start practicing - free, no sign-up required">
                Start practicing free
              </Button>
            </Link>
            <Link href="/practice">
              <Button variant="ghost" size="lg" aria-label="See how Sophocode works">
                See how it works
              </Button>
            </Link>
          </div>
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">No sign-up needed.</p>
        </div>

        {/* Animated code block — decorative */}
        <div
          aria-hidden="true"
          className="mx-auto mt-12 hidden max-w-lg overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 text-left font-[family-name:var(--font-geist-mono)] text-sm sm:block"
          style={{ animation: 'scaleIn 0.5s ease-out 400ms both' }}
        >
          <div className="mb-2 flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full bg-[var(--color-error)]/60" />
            <div className="h-3 w-3 rounded-full bg-[var(--color-warning)]/60" />
            <div className="h-3 w-3 rounded-full bg-[var(--color-success)]/60" />
          </div>
          <pre className="leading-relaxed">
            <code>
              <span className="text-[var(--color-accent)]">def</span>{' '}
              <span className="text-[var(--color-ai-coach)]">two_sum</span>
              <span className="text-[var(--color-text-primary)]">(nums, target):</span>
              {'\n'}
              <span className="text-[var(--color-text-muted)]">
                {' '}
                # Clarify: sorted? duplicates?
              </span>
              {'\n'}
              <span className="text-[var(--color-accent)]"> </span>
              <span className="text-[var(--color-text-primary)]">seen = </span>
              <span className="text-[var(--color-text-primary)]">{'{}'}</span>
              {'\n'}
              <span className="text-[var(--color-accent)]"> for</span>
              <span className="text-[var(--color-text-primary)]"> i, n </span>
              <span className="text-[var(--color-accent)]">in</span>
              <span className="text-[var(--color-text-primary)]"> enumerate(nums):</span>
              {'\n'}
              <span className="text-[var(--color-text-primary)]"> diff = target - n</span>
              {'\n'}
              <span className="text-[var(--color-accent)]"> if</span>
              <span className="text-[var(--color-text-primary)]"> diff </span>
              <span className="text-[var(--color-accent)]">in</span>
              <span className="text-[var(--color-text-primary)]"> seen:</span>
              {'\n'}
              <span className="text-[var(--color-accent)]"> return</span>
              <span className="text-[var(--color-text-primary)]"> [seen[diff], i]</span>
              {'\n'}
              <span className="text-[var(--color-text-primary)]"> seen[n] = i</span>
              <span className="inline-block h-4 w-2 animate-pulse bg-[var(--color-accent)]" />
            </code>
          </pre>
        </div>
      </section>

      {/* Features */}
      <section className="mb-20">
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <Card
              key={feature.title}
              style={{ animation: `slideUp 0.4s ease-out ${i * 150}ms both` }}
            >
              <div className="mb-3" aria-hidden="true">
                {feature.icon}
              </div>
              <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
                {feature.title}
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)]">{feature.description}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Product Preview */}
      <section className="mb-20 text-center" style={{ animation: 'scaleIn 0.5s ease-out' }}>
        <h2 className="mb-6 text-2xl font-bold text-[var(--color-text-primary)]">
          A focused coding environment
        </h2>
        <div className="mx-auto max-w-3xl overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="grid grid-cols-3 divide-x divide-[var(--color-border)]">
            <div className="p-4">
              <div className="mb-2 text-xs font-medium text-[var(--color-accent)]">Problem</div>
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-2 w-4/5 rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-2 w-3/5 rounded bg-[var(--color-bg-elevated)]" />
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 text-xs font-medium text-[var(--color-success)]">Editor</div>
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-2 w-3/4 rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-2 w-5/6 rounded bg-[var(--color-bg-elevated)]" />
                <div className="h-2 w-2/3 rounded bg-[var(--color-bg-elevated)]" />
              </div>
            </div>
            <div className="p-4">
              <div className="mb-2 text-xs font-medium text-[var(--color-ai-coach)]">Coach</div>
              <div className="space-y-1.5">
                <div className="h-2 w-full rounded bg-[var(--color-ai-coach)]/10" />
                <div className="h-2 w-4/5 rounded bg-[var(--color-ai-coach)]/10" />
                <div className="h-2 w-3/5 rounded bg-[var(--color-ai-coach)]/10" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mb-20">
        <dl className="flex flex-col items-center justify-center gap-8 sm:flex-row sm:gap-16">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <dt className="text-3xl font-bold text-[var(--color-accent)]">{stat.value}</dt>
              <dd className="text-sm text-[var(--color-text-secondary)]">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Final CTA */}
      <section
        className="mb-20 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-8 text-center"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, color-mix(in srgb, var(--color-accent) 5%, transparent), transparent 70%)',
        }}
      >
        <h2 className="mb-3 text-2xl font-bold text-[var(--color-text-primary)]">
          Ready to practice?
        </h2>
        <p className="mx-auto mb-6 max-w-md text-[var(--color-text-secondary)]">
          Jump into a problem with Sophia guiding you through the process.
        </p>
        <Link href="/onboarding">
          <Button
            size="lg"
            aria-label="Start practicing now - free"
            style={{ animation: 'glow 3s ease-in-out infinite' }}
          >
            Start practicing free
          </Button>
        </Link>
      </section>
    </div>
  );
}

const features = [
  {
    title: 'Progressive Hints',
    description:
      '3 levels of hints that never spoil the solution. Get just enough help to keep going.',
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        className="text-[var(--color-accent)]"
      >
        <circle cx="16" cy="10" r="6" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13" y="18" width="6" height="4" rx="1" fill="currentColor" opacity="0.3" />
        <rect x="13" y="23" width="6" height="2" rx="1" fill="currentColor" opacity="0.6" />
        <line
          x1="12"
          y1="28"
          x2="20"
          y2="28"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: 'Pattern-Based Learning',
    description:
      'Master 14 DSA patterns, not memorize 1000 problems. Transferable skills for any interview.',
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        className="text-[var(--color-accent)]"
      >
        <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="24" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="16" cy="24" r="3" stroke="currentColor" strokeWidth="1.5" />
        <line x1="10" y1="10" x2="14" y2="22" stroke="currentColor" strokeWidth="1.5" />
        <line x1="22" y1="10" x2="18" y2="22" stroke="currentColor" strokeWidth="1.5" />
        <line x1="11" y1="8" x2="21" y2="8" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
  },
  {
    title: 'Process-First Practice',
    description:
      'Clarify → Plan → Code → Reflect — the real interview process, practiced every session.',
    icon: (
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        className="text-[var(--color-accent)]"
      >
        <rect x="4" y="6" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="13" y="6" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <rect x="22" y="6" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M10 9h3M19 9h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <rect x="13" y="20" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
        <path d="M16 12v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
];

const stats = [
  { value: '14', label: 'DSA Patterns' },
  { value: '3', label: 'Practice Modes' },
  { value: 'AI', label: 'Socratic Coach' },
];
