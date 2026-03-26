import { type MetadataRoute } from 'next';
import { getAllProblemsPublic } from '@/lib/seo/problems';
import { getAllPosts } from '@/lib/content';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let problems: Awaited<ReturnType<typeof getAllProblemsPublic>> = [];
  try {
    problems = await getAllProblemsPublic();
  } catch {
    // DB unavailable at build time — static routes still included
  }
  const blogPosts = getAllPosts('blog');
  const docs = getAllPosts('docs');
  const baseUrl = 'https://patrnco.de';

  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/practice`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    ...blogPosts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.frontmatter.updatedAt ?? post.frontmatter.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...docs.map((doc) => ({
      url: `${baseUrl}/docs/${doc.slug}`,
      lastModified: new Date(doc.frontmatter.updatedAt ?? doc.frontmatter.publishedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...problems.map((problem) => ({
      url: `${baseUrl}/practice/${problem.slug}`,
      lastModified: problem.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
