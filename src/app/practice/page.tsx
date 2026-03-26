import type { Metadata } from 'next';
import ProblemList from '@/components/domain/ProblemList';

export const metadata: Metadata = {
  title: 'Practice Problems - Sophocode',
  description:
    "Browse Sophocode's library of DSA interview problems. Practice with Sophia, your wise AI coach, using progressive hints and pattern-based learning.",
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Practice Problems - Sophocode',
    description:
      "Master coding interview patterns with Sophia's guidance. 14 patterns, progressive hints, and AI coaching.",
    type: 'website',
  },
};

export default function PracticePage() {
  return <ProblemList />;
}
