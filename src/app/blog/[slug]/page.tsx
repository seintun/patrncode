import { notFound } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Metadata } from 'next';
import { getPostBySlug, getAllPosts } from '@/lib/content';

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

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

  const wordCount = post.content.split(/\s+/).filter(Boolean).length;
  const readTimeMinutes = Math.max(1, Math.round(wordCount / 220));
  const publishedLabel = formatDate(post.frontmatter.publishedAt);
  const updatedLabel = post.frontmatter.updatedAt ? formatDate(post.frontmatter.updatedAt) : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto max-w-5xl px-4 pb-20 pt-10 sm:pt-14">
        <Link
          href="/blog"
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-accent)]"
        >
          <span aria-hidden="true">&larr;</span> All posts
        </Link>

        <article className="mx-auto max-w-[72ch]">
          <header
            className="mb-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-7 sm:px-8 sm:py-9"
            style={{
              background:
                'radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 10%, transparent), transparent 55%), var(--color-bg-secondary)',
            }}
          >
            <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]">
              <time dateTime={new Date(post.frontmatter.publishedAt).toISOString()}>
                Published {publishedLabel}
              </time>
              {updatedLabel && <span>Updated {updatedLabel}</span>}
              <span>{readTimeMinutes} min read</span>
            </div>
            <h1 className="mb-4 text-3xl font-bold leading-tight tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
              {post.frontmatter.title}
            </h1>
            <p className="text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
              {post.frontmatter.description}
            </p>
            {post.frontmatter.tags && (
              <div className="mt-5 flex flex-wrap gap-2">
                {post.frontmatter.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-elevated)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          <div className="prose prose-invert max-w-none text-[var(--color-text-secondary)] prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-[var(--color-text-primary)] prose-h2:mt-12 prose-h2:mb-4 prose-h3:mt-10 prose-h3:mb-3 prose-p:my-5 prose-p:leading-8 prose-a:text-[var(--color-accent)] prose-a:decoration-[var(--color-accent)]/40 prose-a:underline-offset-4 prose-strong:text-[var(--color-text-primary)] prose-code:text-[var(--color-accent)] prose-li:my-1 prose-li:text-[var(--color-text-secondary)] prose-th:text-[var(--color-text-primary)] prose-td:text-[var(--color-text-secondary)] prose-blockquote:border-l-[var(--color-accent)] prose-blockquote:text-[var(--color-text-secondary)] prose-pre:border prose-pre:border-[var(--color-border)] prose-pre:bg-[var(--color-bg-secondary)]">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          <footer
            className="mt-16 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-7 sm:px-8"
            style={{
              background:
                'linear-gradient(180deg, color-mix(in srgb, var(--color-accent) 8%, transparent), transparent 30%), var(--color-bg-secondary)',
            }}
          >
            <p className="mb-5 text-[var(--color-text-secondary)]">
              Ready to apply this in a real interview-style session with Sophia?
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/practice"
                className="inline-block rounded-lg bg-[var(--color-accent)] px-5 py-2.5 text-sm font-semibold text-[var(--color-bg-primary)] transition-colors hover:bg-[var(--color-accent-hover)]"
              >
                Start practicing free
              </Link>
              <Link
                href="/blog"
                className="inline-block rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-5 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text-primary)]"
              >
                Browse more posts
              </Link>
            </div>
          </footer>
        </article>
      </div>
    </>
  );
}
