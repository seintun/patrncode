import { type MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', allow: '/practice' },
      { userAgent: '*', allow: '/blog' },
      { userAgent: '*', allow: '/docs' },
      { userAgent: '*', allow: '/onboarding' },
      { userAgent: '*', disallow: '/dashboard' },
      { userAgent: '*', disallow: '/progress' },
      { userAgent: '*', disallow: '/session' },
      { userAgent: '*', disallow: '/login' },
    ],
    sitemap: 'https://patrnco.de/sitemap.xml',
  };
}
