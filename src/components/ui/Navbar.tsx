'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { StreakCounter } from '@/components/domain/StreakCounter';
import { CoinBalance } from '@/components/domain/CoinBalance';
import { useUserProfile } from '@/hooks/useUserProfile';

const NAV_LINKS = [
  { href: '/practice', label: 'Practice' },
  { href: '/blog', label: 'Blog' },
  { href: '/docs', label: 'Docs' },
  { href: '/progress', label: 'Progress' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const profile = useUserProfile();
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Close menu on Escape key + focus management
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        hamburgerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handler);
    // Focus first link when menu opens
    firstLinkRef.current?.focus();
    return () => document.removeEventListener('keydown', handler);
  }, [open]);

  const close = () => {
    setOpen(false);
    hamburgerRef.current?.focus();
  };
  const isActive = (href: string) => pathname === href || pathname?.startsWith(href + '/') === true;

  return (
    <nav
      aria-label="Main navigation"
      className="sticky top-0 z-40 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/90 backdrop-blur"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2 sm:px-6 sm:py-3">
        {/* Logo */}
        <Link
          href="/"
          className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-ai-coach)] bg-clip-text font-mono text-xl font-bold text-transparent transition-opacity hover:opacity-80"
        >
          sophocode
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-1 sm:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <NavLink key={href} href={href} active={isActive(href)}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Desktop streak + coins */}
        <div className="hidden items-center gap-3 sm:flex">
          <div className="group relative" tabIndex={0} aria-describedby="streak-tooltip">
            <StreakCounter
              currentStreak={profile.currentStreak}
              longestStreak={profile.longestStreak}
              lastActivityAt={profile.lastActivityAt}
            />
            <span
              className="pointer-events-none absolute -bottom-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1 text-xs text-[var(--color-text-secondary)] shadow-lg group-hover:block group-focus-within:block"
              id="streak-tooltip"
            >
              Practice streak
            </span>
          </div>
          <div className="group relative" tabIndex={0} aria-describedby="coin-tooltip">
            <CoinBalance coins={profile.coins} tier={profile.tier} />
            <span
              className="pointer-events-none absolute -bottom-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2 py-1 text-xs text-[var(--color-text-secondary)] shadow-lg group-hover:block group-focus-within:block"
              id="coin-tooltip"
            >
              Tokens earned
            </span>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          ref={hamburgerRef}
          id="mobile-menu-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)]/60 text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] sm:hidden"
        >
          {open ? (
            // X icon
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M4 4l12 12M16 4L4 16"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            // Hamburger icon
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M3 5h14M3 10h14M3 15h14"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile drawer — closes on link click or Escape */}
      {open && (
        <div
          id="mobile-menu"
          className="absolute left-0 right-0 top-full z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]/95 px-4 pb-4 pt-2 backdrop-blur sm:hidden"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          <ul className="flex flex-col gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]/40 p-2">
            {NAV_LINKS.map(({ href, label }, i) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={href}
                    onClick={close}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--color-bg-elevated)] text-[var(--color-accent)] ring-1 ring-[var(--color-accent)]/20'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]'
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
            <li aria-hidden="true">
              <div className="my-1 border-t border-[var(--color-border)]" />
            </li>
            <li>
              <div className="rounded-lg bg-[var(--color-bg-secondary)] px-3 py-2.5">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                  Progress
                </div>
                <div className="flex items-center gap-4">
                  <StreakCounter
                    currentStreak={profile.currentStreak}
                    longestStreak={profile.longestStreak}
                    lastActivityAt={profile.lastActivityAt}
                  />
                  <CoinBalance coins={profile.coins} tier={profile.tier} />
                </div>
              </div>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--color-bg-elevated)] text-[var(--color-accent)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </Link>
  );
}
