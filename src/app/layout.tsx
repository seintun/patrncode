import type { Metadata, Viewport } from 'next';
import { Inter, JetBrains_Mono } from 'next/font/google';
import Link from 'next/link';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import JsonLdSchema from '@/components/seo/JsonLdSchema';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const viewport: Viewport = {
  themeColor: '#0a0a0a',
};

export const metadata: Metadata = {
  metadataBase: new URL('https://sophoco.de'),
  title: {
    default: 'Sophocode — AI Coding Interview Practice with Sophia',
    template: '%s | Sophocode',
  },
  description:
    'Sophocode is an AI-powered coding interview prep platform. Practice DSA problems while Sophia, your wise AI coach, guides you with hints, explanations, and mock interviews.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: 'Sophocode — AI DSA Interview Coach & Practice Platform',
    description:
      'Practice LeetCode-style problems with Sophia, your AI interview coach, in a focused VS Code-like playground.',
    url: 'https://sophoco.de',
    siteName: 'sophocode',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sophocode — AI Coding Interview Practice with Sophia',
    description:
      'Practice coding interviews with Sophia, your wise AI coach. Pattern-based learning and progressive hints.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'sophocode',
  url: 'https://sophoco.de',
  logo: 'https://sophoco.de/favicon.ico',
  description: 'AI-coached coding interview practice platform with Sophia',
  sameAs: [],
};

const webAppSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'sophocode',
  url: 'https://sophoco.de',
  description:
    'Practice coding interviews with Sophia, your wise AI coach. Pattern-based learning, progressive hints, and process-first sessions.',
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'Any',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-inter)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-bg-primary)]"
        >
          Skip to content
        </a>
        <nav
          aria-label="Main navigation"
          className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-6 py-3"
        >
          <Link
            href="/"
            className="text-xl font-bold text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
          >
            sophocode
          </Link>
          <div className="flex items-center gap-6">
            <NavLink href="/practice">Practice</NavLink>
            <NavLink href="/blog">Blog</NavLink>
            <NavLink href="/docs">Docs</NavLink>
            <NavLink href="/progress">Progress</NavLink>
          </div>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)]"
          >
            Sign in
          </Link>
        </nav>
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Analytics />
        <JsonLdSchema schema={organizationSchema} />
        <JsonLdSchema schema={webAppSchema} />
      </body>
    </html>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)] data-[active=true]:text-[var(--color-accent)]"
    >
      {children}
    </Link>
  );
}
