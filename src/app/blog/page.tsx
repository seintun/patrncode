import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/content';

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export const metadata: Metadata = {
  title: 'Blog',
  description:
    "Coding interview tips, DSA pattern deep-dives, and learning strategies from the Sophocode team — guided by Sophia's wisdom-first approach.",
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Blog — Sophocode',
    description:
      "Coding interview tips, DSA pattern deep-dives, and learning strategies from the Sophocode team — guided by Sophia's wisdom-first approach.",
    type: 'website',
  },
};

export default function BlogPage() {
  const posts = getAllPosts('blog');

  return (
    <div className="mx-auto max-w-5xl px-4 pb-20 pt-12 sm:pt-16">
      <section
        className="mb-10 rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] px-5 py-8 sm:mb-12 sm:px-8 sm:py-10"
        style={{
          background:
            'radial-gradient(circle at top right, color-mix(in srgb, var(--color-accent) 12%, transparent), transparent 55%), var(--color-bg-secondary)',
        }}
      >
        <span className="mb-4 inline-flex items-center rounded-full border border-[var(--color-accent)]/30 bg-[var(--color-accent)]/10 px-3 py-1 text-xs font-medium text-[var(--color-accent)]">
          Sophocode Journal
        </span>
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-5xl">
          Interview prep, explained clearly
        </h1>
        <p className="max-w-2xl text-base leading-relaxed text-[var(--color-text-secondary)] sm:text-lg">
          Patterns, process, and practice notes for engineers preparing for coding interviews.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-1">
            {posts.length} {posts.length === 1 ? 'article' : 'articles'}
          </span>
          <span>Updated regularly by the Sophocode team</span>
        </div>
      </section>

      {posts.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">No posts yet.</p>
      ) : (
        <ul className="grid gap-5 sm:gap-6 lg:grid-cols-2">
          {posts.map((post) => (
            <li key={post.slug} className="h-full">
              <Link
                href={`/blog/${post.slug}`}
                className="group flex h-full flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-accent)]/40 hover:shadow-[0_10px_30px_-20px_color-mix(in_srgb,var(--color-accent)_60%,transparent)] sm:p-6"
              >
                <time className="mb-2 block text-sm text-[var(--color-text-muted)]">
                  {formatDate(post.frontmatter.publishedAt)}
                </time>
                <h2 className="mb-3 text-xl font-semibold leading-snug text-[var(--color-text-primary)] transition-colors group-hover:text-[var(--color-accent)] sm:text-2xl">
                  {post.frontmatter.title}
                </h2>
                <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] sm:text-base">
                  {post.frontmatter.description}
                </p>
                {post.frontmatter.tags && (
                  <div className="mt-4 flex flex-wrap gap-2">
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
                <span className="mt-5 inline-flex items-center text-sm font-medium text-[var(--color-accent)]">
                  Read article <span aria-hidden="true">&rarr;</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
