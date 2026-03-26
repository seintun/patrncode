import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <section className="mb-20 text-center">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-[var(--color-text-primary)]">
          Practice coding interviews{' '}
          <span className="text-[var(--color-accent)]">with an AI coach</span>
        </h1>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-[var(--color-text-secondary)]">
          Learn patterns, not just problems. Get coached through Clarify → Plan → Code → Reflect.
        </p>
        <Link href="/practice">
          <Button size="lg">Start practicing free</Button>
        </Link>
        <p className="mt-3 text-sm text-[var(--color-text-muted)]">
          No sign-up needed. Jump right in.
        </p>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <div className="mb-3 text-2xl">💡</div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            Progressive Hints
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            3 levels of hints that never spoil the solution. Get just enough help to keep going.
          </p>
        </Card>
        <Card>
          <div className="mb-3 text-2xl">🧩</div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            Pattern-Based Learning
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Master 14 DSA patterns, not memorize 1000 problems. Transferable skills for any
            interview.
          </p>
        </Card>
        <Card>
          <div className="mb-3 text-2xl">🎯</div>
          <h3 className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]">
            Process-First Practice
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Clarify → Plan → Code → Reflect — the real interview process, practiced every session.
          </p>
        </Card>
      </section>
    </div>
  );
}
