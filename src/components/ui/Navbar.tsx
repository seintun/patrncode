'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';

const NAV_LINKS = [
  { href: '/practice', label: 'Practice' },
  { href: '/blog', label: 'Blog' },
  { href: '/docs', label: 'Docs' },
  { href: '/progress', label: 'Progress' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
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
      className="relative border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]"
    >
      <div className="flex items-center justify-between px-4 py-2 sm:px-6 sm:py-3">
        {/* Logo */}
        <Link
          href="/"
          className="bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-ai-coach)] bg-clip-text font-mono text-xl font-bold text-transparent transition-opacity hover:opacity-80"
        >
          sophocode
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 sm:flex">
          {NAV_LINKS.map(({ href, label }) => (
            <NavLink key={href} href={href} active={isActive(href)}>
              {label}
            </NavLink>
          ))}
        </div>

        {/* Desktop sign-in */}
        <Link
          href="/login"
          className="hidden text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)] sm:block"
        >
          Sign in
        </Link>

        {/* Mobile hamburger */}
        <button
          ref={hamburgerRef}
          id="mobile-menu-toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen((v) => !v)}
          className="flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)] sm:hidden"
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
          className="absolute left-0 right-0 top-full z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-4 pb-4 pt-2 sm:hidden"
          style={{ animation: 'fadeIn 0.15s ease-out' }}
        >
          <ul className="flex flex-col gap-1">
            {NAV_LINKS.map(({ href, label }, i) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={href}
                    onClick={close}
                    aria-current={active ? 'page' : undefined}
                    className={`block rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[var(--color-bg-elevated)] text-[var(--color-accent)]'
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
              <Link
                href="/login"
                onClick={close}
                className="block rounded-md px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-accent)]"
              >
                Sign in
              </Link>
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
      className={`text-sm font-medium transition-colors ${
        active
          ? 'text-[var(--color-accent)]'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
      }`}
    >
      {children}
    </Link>
  );
}
