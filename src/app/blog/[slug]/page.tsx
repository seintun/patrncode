import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import { getPostBySlug, getAllPosts } from '@/lib/content';

export async function generateStaticParams() {
  const posts = getAllPosts('blog');
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug, 'blog');

  if (!post) {
    return {
      title: 'Post Not Found',
      robots: { index: false },
    };
  }

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    robots: { index: true, follow: true },
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      type: 'article',
      publishedTime: new Date(post.frontmatter.publishedAt).toISOString(),
      modifiedTime: post.frontmatter.updatedAt
        ? new Date(post.frontmatter.updatedAt).toISOString()
        : undefined,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPostBySlug(slug, 'blog');

  if (!post) notFound();

  // Article schema — content is from our own markdown files, JSON.stringify handles escaping
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    datePublished: new Date(post.frontmatter.publishedAt).toISOString(),
    dateModified: new Date(
      post.frontmatter.updatedAt ?? post.frontmatter.publishedAt,
    ).toISOString(),
    author: { '@type': 'Organization', name: 'sophocode', url: 'https://sophoco.de' },
    publisher: { '@type': 'Organization', name: 'sophocode', url: 'https://sophoco.de' },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://sophoco.de/blog/${slug}` },
  };

  return (
    <>
      {}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto max-w-3xl px-4 py-16">
        <Link
          href="/blog"
          className="mb-8 inline-block text-sm text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors"
        >
          &larr; All posts
        </Link>

        <header className="mb-10">
          <time className="mb-2 block text-sm text-[var(--color-text-muted)]">
            {new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
          <h1 className="mb-4 text-4xl font-bold leading-tight text-[var(--color-text-primary)]">
            {post.frontmatter.title}
          </h1>
          <p className="text-lg text-[var(--color-text-secondary)]">
            {post.frontmatter.description}
          </p>
          {post.frontmatter.tags && (
            <div className="mt-4 flex flex-wrap gap-2">
              {post.frontmatter.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[var(--color-bg-elevated)] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)]"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </header>

        <article className="prose prose-invert max-w-none prose-headings:text-[var(--color-text-primary)] prose-p:text-[var(--color-text-secondary)] prose-a:text-[var(--color-accent)] prose-strong:text-[var(--color-text-primary)] prose-code:text-[var(--color-accent)] prose-li:text-[var(--color-text-secondary)] prose-th:text-[var(--color-text-primary)] prose-td:text-[var(--color-text-secondary)]">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
        </article>

        <footer className="mt-16 border-t border-[var(--color-border)] pt-8">
          <p className="mb-4 text-[var(--color-text-secondary)]">
            Ready to practice these patterns with an AI coach?
          </p>
          <Link
            href="/practice"
            className="inline-block rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-bg-primary)] hover:bg-[var(--color-accent-hover)] transition-colors"
          >
            Start practicing free
          </Link>
        </footer>
      </div>
    </>
  );
}
