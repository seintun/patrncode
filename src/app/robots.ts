import { type MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/practice', '/blog', '/docs', '/onboarding'],
        disallow: ['/dashboard', '/progress', '/session', '/login'],
      },
    ],
    sitemap: 'https://sophoco.de/sitemap.xml',
  };
}
