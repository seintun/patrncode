import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'patrncode — AI Coding Interview Practice',
  description:
    'Practice coding interviews with an AI coach. Pattern-based learning, progressive hints, and process-first sessions.',
  openGraph: {
    title: 'patrncode — AI Coding Interview Practice',
    description:
      'Learn patterns, not just problems. Get coached through Clarify → Plan → Code → Reflect.',
    type: 'website',
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
