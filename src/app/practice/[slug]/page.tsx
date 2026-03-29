import { notFound } from 'next/navigation';
import ProblemDetailClient from './ProblemDetailClient';
import { getProblemBySlug, getAllProblemsPublic } from '@/lib/seo/problems';
import type { Metadata } from 'next';

export const revalidate = 3600; // 1 hour

export async function generateStaticParams() {
  const problems = await getAllProblemsPublic();
  return problems.map((p) => ({
    slug: p.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);

  if (!problem) {
    return {
      title: 'Problem Not Found - Sophocode',
      description: 'The requested coding problem could not be found.',
      robots: { index: false, follow: false },
    };
  }

  // Clean description: strip markdown, limit to 160 chars
  const plainStatement = problem.statement
    .replace(/[#*`\n]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const description = plainStatement.substring(0, 160) + (plainStatement.length > 160 ? '...' : '');

  return {
    title: `${problem.title} - Sophocode`,
    description,
    robots: { index: true, follow: true },
    openGraph: {
      title: problem.title,
      description,
      type: 'article',
      publishedTime: problem.updatedAt.toISOString(),
    },
  };
}

export default async function ProblemPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const problem = await getProblemBySlug(slug);

  if (!problem) {
    notFound();
  }

  // Serialize Prisma model (Date fields → strings) before passing to client component
  const plainProblem = JSON.parse(JSON.stringify(problem));
  return <ProblemDetailClient problem={plainProblem} />;
}
