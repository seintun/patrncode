# SEO — Overview

This directory documents the SEO strategy, technical implementation, monitoring setup, and content approach for patrncode.

## Contents

| File                                         | Covers                                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------- |
| [implementation.md](./implementation.md)     | What was built, phase by phase — architecture decisions, file locations, how each piece works |
| [monitoring.md](./monitoring.md)             | Search Console setup, GA4 configuration, audit schedule, KPIs                                 |
| [content-strategy.md](./content-strategy.md) | Keyword targets, blog content calendar, docs expansion plan                                   |

## Current Status

| Phase                           | Description                                      | Status      |
| ------------------------------- | ------------------------------------------------ | ----------- |
| 1 — Technical foundation        | Metadata, sitemap, robots, headers               | Done        |
| 2 — Structured data             | JSON-LD schemas (Org, WebApp, FAQ, Article)      | Done        |
| 3 — Server component conversion | Problem detail page with `generateMetadata`      | Done        |
| 4 — Content infrastructure      | Blog + docs routes, 3 posts, gray-matter         | Done        |
| 5 — GEO / AI search             | `llms.txt`, Article schema on blog, robots allow | Done        |
| 6 — Monitoring                  | Search Console, GA4, audit docs                  | In progress |

## Quick Reference

- **Domain:** `https://patrnco.de`
- **Sitemap:** `https://patrnco.de/sitemap.xml`
- **robots.txt:** `https://patrnco.de/robots.txt`
- **llms.txt:** `https://patrnco.de/llms.txt`
- **metadataBase:** set in `src/app/layout.tsx`

## Key Files

```
src/
├── app/
│   ├── layout.tsx              # Root metadata, JSON-LD schemas, Vercel Analytics
│   ├── sitemap.ts              # Dynamic sitemap (problems + blog + docs)
│   ├── robots.ts               # Crawl rules
│   ├── blog/
│   │   ├── page.tsx            # Blog listing with metadata
│   │   └── [slug]/page.tsx     # Blog post with generateMetadata + Article schema
│   ├── docs/
│   │   └── [[...slug]]/page.tsx # Docs with generateMetadata
│   └── practice/
│       ├── page.tsx            # Practice listing with metadata
│       └── [slug]/page.tsx     # Problem page with generateMetadata (server component)
├── components/seo/
│   └── JsonLdSchema.tsx        # Client component for JSON-LD injection
├── content/
│   ├── blog/                   # Markdown blog posts with frontmatter
│   └── docs/                   # Markdown docs with frontmatter
└── lib/
    ├── content.ts              # getAllPosts / getPostBySlug utilities
    └── seo/
        └── problems.ts         # getProblemBySlug / getAllProblemsPublic for SEO
public/
└── llms.txt                    # AI system description (GEO)
```
