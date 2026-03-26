'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

const TOTAL_STEPS = 5;

interface StepProps {
  onNext: () => void;
  onSkip: () => void;
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
    <button
      onClick={onSkip}
      className="mt-4 text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-secondary)]"
    >
      Skip to practice
    </button>
  );
}

// Step 1: Welcome — Experience Level
function WelcomeStep({ onNext, onSkip }: StepProps) {
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
    <div className="space-y-6 text-center">
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

// Step 2: What Interviews Test
function InterviewTestStep({ onNext, onSkip }: StepProps) {
  const bullets = [
    'Pattern recognition — spotting the underlying structure in a problem',
    'Communication — explaining your thought process clearly',
    'Complexity analysis — understanding time and space trade-offs',
    'Edge case handling — thinking beyond the happy path',
  ];

  return (
    <div className="space-y-6 text-center">
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

// Step 3: The Process
function ProcessStep({ onNext, onSkip }: StepProps) {
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
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">The Process</h2>
        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
          Every problem follows the same four-phase process.
        </p>
      </div>
      <div className="mx-auto flex max-w-3xl items-start gap-0">
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

// Step 4: Big-O Made Simple
function BigOStep({ onNext, onSkip }: StepProps) {
  const complexities = [
    { label: 'O(1)', name: 'Constant', color: 'var(--color-bigo-green)', height: 12 },
    { label: 'O(log n)', name: 'Logarithmic', color: 'var(--color-bigo-green)', height: 28 },
    { label: 'O(n)', name: 'Linear', color: 'var(--color-bigo-yellow)', height: 55 },
    { label: 'O(n log n)', name: 'Linearithmic', color: 'var(--color-bigo-yellow)', height: 72 },
    { label: 'O(n²)', name: 'Quadratic', color: 'var(--color-bigo-red)', height: 100 },
  ];

  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Big-O Made Simple</h2>
        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
          Big-O tells you how your solution scales as input grows.
        </p>
      </div>
      <div className="mx-auto max-w-lg">
        <div className="flex items-end justify-center gap-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-6">
          {complexities.map((c, i) => (
            <div key={c.label} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-xs font-medium text-[var(--color-text-muted)]">{c.name}</span>
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

// Step 5: Try First Problem
function TryFirstStep({ onSkip }: { onSkip: () => void }) {
  function handleStart() {
    localStorage.setItem('sophocode_onboarding_completed', 'true');
    window.location.href = '/practice';
  }

  return (
    <div className="space-y-6 text-center">
      <div>
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">You&rsquo;re ready!</h2>
        <p className="mt-2 text-lg text-[var(--color-text-secondary)]">
          Let&rsquo;s start with an easy problem.
        </p>
      </div>
      <Card className="mx-auto max-w-md">
        <div className="space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            You&rsquo;ll work through the problem using the Clarify → Plan → Code → Reflect process
            with Sophia guiding you every step of the way.
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
    <WelcomeStep key="welcome" onNext={handleNext} onSkip={handleSkip} />,
    <InterviewTestStep key="interview" onNext={handleNext} onSkip={handleSkip} />,
    <ProcessStep key="process" onNext={handleNext} onSkip={handleSkip} />,
    <BigOStep key="bigo" onNext={handleNext} onSkip={handleSkip} />,
    <TryFirstStep key="try" onSkip={handleSkip} />,
  ];

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center bg-[var(--color-bg-primary)] px-4 py-12">
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
