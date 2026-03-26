import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllPosts } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Coding interview tips, pattern deep-dives, and learning strategies from the patrncode team.',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'Blog — patrncode',
    description:
      'Coding interview tips, pattern deep-dives, and learning strategies from the patrncode team.',
    type: 'website',
  },
};

export default function BlogPage() {
  const posts = getAllPosts('blog');

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="mb-3 text-4xl font-bold text-[var(--color-text-primary)]">Blog</h1>
      <p className="mb-12 text-[var(--color-text-secondary)]">
        Patterns, process, and practice — guides for engineers preparing for technical interviews.
      </p>

      {posts.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">No posts yet.</p>
      ) : (
        <ul className="space-y-10">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <time className="mb-1 block text-sm text-[var(--color-text-muted)]">
                  {new Date(post.frontmatter.publishedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
                <h2 className="mb-2 text-xl font-semibold text-[var(--color-text-primary)] group-hover:text-[var(--color-accent)] transition-colors">
                  {post.frontmatter.title}
                </h2>
                <p className="text-[var(--color-text-secondary)]">{post.frontmatter.description}</p>
                {post.frontmatter.tags && (
                  <div className="mt-3 flex flex-wrap gap-2">
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
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
