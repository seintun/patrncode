import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';
import JsonLdSchema from '@/components/seo/JsonLdSchema';
import Navbar from '@/components/ui/Navbar';

export const viewport: Viewport = {
  themeColor: '#080c18',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
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
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col font-[family-name:var(--font-geist-sans)]">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-bg-primary)]"
        >
          Skip to content
        </a>
        <a
          href="#code-editor"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-40 focus:z-50 focus:rounded-lg focus:bg-[var(--color-accent)] focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-[var(--color-bg-primary)]"
        >
          Skip to editor
        </a>
        <Navbar />
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
