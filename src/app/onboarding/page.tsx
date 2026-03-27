'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SophiaBubble } from '@/components/ui/SophiaBubble';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 6;

interface StepProps {
  onNext: () => void;
  onSkip: () => void;
  stepKey: number;
}

function StepIndicator({
  current,
  total,
  onNavigate,
}: {
  current: number;
  total: number;
  onNavigate: (step: number) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 pt-6">
      {Array.from({ length: total }, (_, i) => (
        <button
          key={i}
          onClick={() => onNavigate(i)}
          aria-label={`Go to step ${i + 1}`}
          className={cn(
            'h-2.5 w-2.5 rounded-full transition-all',
            i === current
              ? 'w-6 bg-[var(--color-accent)]'
              : 'bg-[var(--color-bg-elevated)] hover:bg-[var(--color-text-muted)]',
          )}
        />
      ))}
    </div>
  );
}

function SkipLink({ onSkip }: { onSkip: () => void }) {
  return (
    <div className="mt-4 block w-full text-center sm:mt-8">
      <button
        onClick={onSkip}
        className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-[var(--color-text-muted)] transition-all hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]"
      >
        <span>Skip to practice</span>
        <span
          className="opacity-70 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </button>
    </div>
  );
}

// Step 1: Meet Sophia (new)
function MeetSophiaStep({ onNext, onSkip }: StepProps) {
  return (
    <div className="space-y-5 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sophia/modes_sophia.avif"
          alt="Sophia, your AI coding coach"
          className="h-[180px] w-[180px] rounded-xl object-cover sm:h-[260px] sm:w-[260px]"
          style={{
            outline: '2px solid #2dd4bf',
            outlineOffset: '3px',
          }}
        />
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
            Meet Sophia
          </h1>
          <p className="mt-1 text-sm font-medium" style={{ color: '#2dd4bf' }}>
            Your AI Coding Coach
          </p>
        </div>
        <p className="mx-auto max-w-md text-base text-[var(--color-text-secondary)] sm:text-lg">
          &ldquo;Hey, I&rsquo;m Sophia. Think of me as the senior engineer sitting right next to
          you. I won&rsquo;t just hand you the answer, but I&rsquo;ll never let you stay stuck
          either.&rdquo;
        </p>
      </div>
      <Button onClick={onNext} size="lg">
        Let&rsquo;s go
      </Button>
      <SkipLink onSkip={onSkip} />
    </div>
  );
}

// Step 2: Welcome — Experience Level
function WelcomeStep({ onNext, onSkip, stepKey }: StepProps) {
  const levels = [
    {
      key: 'new',
      title: 'New to DSA',
      desc: "I'm just starting out with data structures and algorithms",
    },
    {
      key: 'some',
      title: 'Some Experience',
      desc: 'I know the basics but want to level up',
    },
    {
      key: 'retesting',
      title: 'Retesting',
      desc: "I'm preparing for upcoming interviews",
    },
  ] as const;

  function selectLevel(level: string) {
    localStorage.setItem('sophocode_experience_level', level);
    onNext();
  }

  return (
    <div className="space-y-4 text-center sm:space-y-6">
      <SophiaBubble
        text="First things first, where are you starting from? No wrong answer here."
        stepKey={stepKey}
      />
      <div>
        <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
          Welcome to sophocode
        </h1>
        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">What brings you here?</p>
      </div>
      <div className="mx-auto grid max-w-lg gap-4">
        {levels.map((level) => (
          <Card
            key={level.key}
            onClick={() => selectLevel(level.key)}
            className="text-left transition-all hover:border-[var(--color-accent)]"
          >
            <p className="font-semibold text-[var(--color-text-primary)]">{level.title}</p>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">{level.desc}</p>
          </Card>
        ))}
      </div>
      <SkipLink onSkip={onSkip} />
    </div>
  );
}

// Step 3: What Interviews Test
function InterviewTestStep({ onNext, onSkip, stepKey }: StepProps) {
  const bullets = [
    'Pattern recognition: spotting the underlying structure in a problem',
    'Communication: explaining your thought process clearly',
    'Complexity analysis: understanding time and space trade-offs',
    'Edge case handling: thinking beyond the happy path',
  ];

  return (
    <div className="space-y-4 text-center sm:space-y-6">
      <SophiaBubble
        text="Here's what most people get wrong: interviews aren't testing if you know the answer. They're testing how you think."
        stepKey={stepKey}
      />
      <div>
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">
          What Interviews Test
        </h2>
        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
          Interviews test your problem-solving process, not just the answer.
        </p>
      </div>
      <Card className="mx-auto max-w-lg text-left">
        <ul className="space-y-3">
          {bullets.map((bullet) => (
            <li
              key={bullet}
              className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)]"
            >
              <span className="mt-0.5 text-[var(--color-accent)]">&#10003;</span>
              {bullet}
            </li>
          ))}
        </ul>
      </Card>
      <Button onClick={onNext} size="lg">
        Continue
      </Button>
      <SkipLink onSkip={onSkip} />
    </div>
  );
}

// Step 4: The Process
function ProcessStep({ onNext, onSkip, stepKey }: StepProps) {
  const phases = [
    {
      num: '1',
      title: 'Clarify',
      desc: 'Understand the problem and ask the right questions',
    },
    {
      num: '2',
      title: 'Plan',
      desc: 'Choose the right pattern and outline your approach',
    },
    {
      num: '3',
      title: 'Code',
      desc: 'Implement your plan cleanly and incrementally',
    },
    {
      num: '4',
      title: 'Reflect',
      desc: 'Analyze complexity, review edge cases, and learn',
    },
  ];

  return (
    <div className="space-y-4 text-center sm:space-y-6">
      <SophiaBubble
        text="I'll be coaching you through this same four-step process every session. It works for any problem, any company."
        stepKey={stepKey}
      />
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
          The Process
        </h2>
        <p className="mt-1 text-base text-[var(--color-text-secondary)] sm:mt-2 sm:text-lg">
          Every problem follows the same four-phase process.
        </p>
      </div>

      {/* Mobile: compact vertical list */}
      <div className="mx-auto flex max-w-sm flex-col gap-2 sm:hidden">
        {phases.map((phase) => (
          <div
            key={phase.title}
            className="flex items-center gap-3 rounded-lg bg-[var(--color-bg-elevated)] px-4 py-3 text-left"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-bg-primary)] text-sm font-bold text-[var(--color-accent)]">
              {phase.num}
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                {phase.title}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)]">{phase.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop: horizontal flow with connectors */}
      <div className="mx-auto hidden max-w-3xl sm:flex sm:flex-row sm:items-start">
        {phases.map((phase, i) => (
          <div key={phase.title} className="flex flex-1 items-start">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-bg-elevated)] text-lg font-bold text-[var(--color-accent)]">
                {phase.num}
              </div>
              <p className="mt-2 font-semibold text-[var(--color-text-primary)]">{phase.title}</p>
              <p className="mt-1 px-2 text-xs text-[var(--color-text-secondary)]">{phase.desc}</p>
            </div>
            {i < phases.length - 1 && (
              <div className="mt-6 flex-1 border-t-2 border-dashed border-[var(--color-border)]" />
            )}
          </div>
        ))}
      </div>

      <Button onClick={onNext} size="lg">
        Continue
      </Button>
      <SkipLink onSkip={onSkip} />
    </div>
  );
}

// Step 5: Big-O Made Simple
function BigOStep({ onNext, onSkip, stepKey }: StepProps) {
  const complexities = [
    { label: 'O(1)', name: 'Constant', color: 'var(--color-bigo-green)', height: 12 },
    { label: 'O(log n)', name: 'Logarithmic', color: 'var(--color-bigo-green)', height: 28 },
    { label: 'O(n)', name: 'Linear', color: 'var(--color-bigo-yellow)', height: 55 },
    { label: 'O(n log n)', name: 'Linearithmic', color: 'var(--color-bigo-yellow)', height: 72 },
    { label: 'O(n²)', name: 'Quadratic', color: 'var(--color-bigo-red)', height: 100 },
  ];

  return (
    <div className="space-y-4 text-center sm:space-y-6">
      <SophiaBubble
        text="One thing interviewers always ask about: how efficient is your solution? Here's what that means."
        stepKey={stepKey}
      />
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
          Big-O Made Simple
        </h2>
        <p className="mt-1 text-base text-[var(--color-text-secondary)] sm:mt-2 sm:text-lg">
          Big-O tells you how your solution scales as input grows.
        </p>
      </div>
      <div className="mx-auto max-w-2xl overflow-x-auto">
        <div className="flex min-w-[300px] items-stretch justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          {complexities.map((c, i) => (
            <div
              key={c.label}
              className={cn(
                'flex flex-1 flex-col items-center pb-4 pt-6 transition-colors',
                i % 2 === 1 ? 'bg-[var(--color-bg-elevated)]/30' : 'bg-transparent',
              )}
            >
              <span className="text-xs font-medium text-[var(--color-text-muted)]">{c.name}</span>
              <div className="mb-2 mt-4 flex h-[120px] w-full items-end justify-center">
                <div
                  className="w-full max-w-16 rounded-t-md transition-all"
                  style={
                    {
                      backgroundColor: c.color,
                      animationDelay: `${i * 0.2}s`,
                      animation: 'bar-grow 1s ease-out forwards',
                      '--bar-height': `${c.height}%`,
                    } as React.CSSProperties
                  }
                />
              </div>
              <span className="text-xs font-semibold text-[var(--color-text-secondary)]">
                {c.label}
              </span>
            </div>
          ))}
        </div>
      </div>
      <Button onClick={onNext} size="lg">
        Continue
      </Button>
      <SkipLink onSkip={onSkip} />
    </div>
  );
}

// Step 6: Try First Problem
function TryFirstStep({ onSkip, stepKey }: { onSkip: () => void; stepKey: number }) {
  function handleStart() {
    localStorage.setItem('sophocode_onboarding_completed', 'true');
    window.location.href = '/practice';
  }

  return (
    <div className="space-y-4 text-center sm:space-y-6">
      <SophiaBubble
        text="That's everything you need to get started. I'll be right there with you. Let's go."
        stepKey={stepKey}
      />
      <div>
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] sm:text-3xl">
          You&rsquo;re ready!
        </h2>
        <p className="mt-1 text-base text-[var(--color-text-secondary)] sm:mt-2 sm:text-lg">
          Let&rsquo;s start with an easy problem.
        </p>
      </div>
      <Card className="mx-auto max-w-md">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            You&rsquo;ll work through the problem using the{' '}
            <span className="inline-flex flex-wrap items-center gap-x-0.5 rounded-md bg-[var(--color-bg-elevated)] px-2 py-0.5 text-xs font-semibold text-[var(--color-accent)] ring-1 ring-inset ring-[var(--color-border)]">
              <span>Clarify</span>
              <span className="text-[var(--color-text-muted)]">→</span>
              <span>Plan</span>
              <span className="text-[var(--color-text-muted)]">→</span>
              <span>Code</span>
              <span className="text-[var(--color-text-muted)]">→</span>
              <span>Reflect</span>
            </span>{' '}
            process with Sophia guiding you every step of the way.
          </p>
          <Button onClick={handleStart} size="lg" className="w-full">
            Start Practicing
          </Button>
        </div>
      </Card>
      <SkipLink onSkip={onSkip} />
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const completed = localStorage.getItem('sophocode_onboarding_completed');
    if (completed === 'true') {
      router.replace('/practice');
    }
  }, [router]);

  useEffect(() => {
    const timer = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(timer);
  }, []);

  function handleSkip() {
    localStorage.setItem('sophocode_onboarding_completed', 'true');
    router.push('/practice');
  }

  function handleNext() {
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleNavigate(target: number) {
    setStep(target);
  }

  if (!ready) return null;

  const stepComponents = [
    <MeetSophiaStep key="meet" onNext={handleNext} onSkip={handleSkip} stepKey={step} />,
    <WelcomeStep key="welcome" onNext={handleNext} onSkip={handleSkip} stepKey={step} />,
    <InterviewTestStep key="interview" onNext={handleNext} onSkip={handleSkip} stepKey={step} />,
    <ProcessStep key="process" onNext={handleNext} onSkip={handleSkip} stepKey={step} />,
    <BigOStep key="bigo" onNext={handleNext} onSkip={handleSkip} stepKey={step} />,
    <TryFirstStep key="try" onSkip={handleSkip} stepKey={step} />,
  ];

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-start overflow-y-auto bg-[var(--color-bg-primary)] px-4 py-6 sm:justify-center sm:py-12">
      <div
        key={step}
        className="w-full animate-[fadeIn_0.3s_ease-out]"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      >
        {stepComponents[step]}
      </div>
      <StepIndicator current={step} total={TOTAL_STEPS} onNavigate={handleNavigate} />
    </div>
  );
}
