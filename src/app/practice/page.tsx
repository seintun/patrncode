import type { Metadata } from 'next';
import ProblemList from '@/components/domain/ProblemList';

export const metadata: Metadata = {
  title: 'Practice Problems - patrncode',
  description:
    'Browse our library of coding interview problems covering 14 essential DSA patterns. Filter by difficulty, pattern, and track your mastery.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Practice Problems - patrncode',
    description:
      'Master coding interview patterns with our curated problem set. 14 patterns, progressive hints, and AI coaching.',
    type: 'website',
  },
};

export default function PracticePage() {
  return <ProblemList />;
}
