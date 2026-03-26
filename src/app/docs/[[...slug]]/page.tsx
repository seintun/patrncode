import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import { getPostBySlug, getAllPosts } from '@/lib/content';

const DEFAULT_SLUG = 'getting-started';

export async function generateStaticParams() {
  const docs = getAllPosts('docs');
  return [{ slug: [] }, ...docs.map((doc) => ({ slug: [doc.slug] }))];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const docSlug = slug?.[0] ?? DEFAULT_SLUG;
  const doc = getPostBySlug(docSlug, 'docs');

  if (!doc) {
    return {
      title: 'Documentation Not Found',
      robots: { index: false },
    };
  }

  return {
    title: doc.frontmatter.title,
    description: doc.frontmatter.description,
    robots: { index: true, follow: true },
    openGraph: {
      title: doc.frontmatter.title,
      description: doc.frontmatter.description,
      type: 'website',
    },
  };
}

export default async function DocsPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const docSlug = slug?.[0] ?? DEFAULT_SLUG;
  const doc = getPostBySlug(docSlug, 'docs');

  if (!doc) notFound();

  const allDocs = getAllPosts('docs');

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="flex gap-12">
        <nav className="hidden w-48 shrink-0 md:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
            Documentation
          </p>
          <ul className="space-y-1">
            {allDocs.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/docs/${d.slug}`}
                  className={`block rounded px-2 py-1.5 text-sm transition-colors ${
                    d.slug === docSlug
                      ? 'bg-[var(--color-bg-elevated)] text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
                  }`}
                >
                  {d.frontmatter.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <article className="min-w-0 flex-1 prose prose-invert max-w-none prose-headings:text-[var(--color-text-primary)] prose-p:text-[var(--color-text-secondary)] prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-text-primary)] prose-code:text-[var(--color-accent)] prose-li:text-[var(--color-text-secondary)] prose-th:text-[var(--color-text-primary)] prose-td:text-[var(--color-text-secondary)]">
          <h1 className="mb-2 text-3xl font-bold text-[var(--color-text-primary)]">
            {doc.frontmatter.title}
          </h1>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
