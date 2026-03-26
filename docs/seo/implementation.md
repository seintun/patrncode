# SEO — Technical Implementation

## Phase 1: Technical Foundation

### Root Metadata (`src/app/layout.tsx`)

`metadataBase` is set to `https://sophoco.de` so all relative OG image URLs resolve correctly. The title uses a template (`%s | sophocode`) so child pages only need to set the page-specific portion.

```ts
export const metadata: Metadata = {
  metadataBase: new URL('https://sophoco.de'),
  title: { default: 'sophocode — AI Coding Interview Practice', template: '%s | sophocode' },
  // ... openGraph, twitter, robots
};
```

### Per-Page Metadata

Public pages export a `metadata` constant from their server component:

```ts
// src/app/practice/page.tsx
export const metadata: Metadata = {
  title: 'Practice Problems - sophocode',
  description: '...',
  robots: { index: true, follow: true },
};
```

**Important:** `metadata` exports only work in server components (no `'use client'`). Private pages
(`/dashboard`, `/session`, `/progress`, `/login`) are client components and cannot export metadata
— they are blocked at the crawler level via `robots.ts` instead.

### Sitemap (`src/app/sitemap.ts`)

Generated dynamically at request time (or statically at build). Combines:

- Static routes (home, `/practice`, `/blog`, `/docs`)
- All published problems from Prisma (`getAllProblemsPublic`)
- All blog posts from the filesystem (`getAllPosts('blog')`)
- All docs from the filesystem (`getAllPosts('docs')`)

### robots.ts (`src/app/robots.ts`)

Allows public routes, disallows all private/app routes:

```
Allow: /, /practice, /blog, /docs, /onboarding
Disallow: /dashboard, /progress, /session, /login
```

### Security & Cache Headers (`next.config.ts`)

Applied via `headers()`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Cache-Control: public, max-age=31536000, immutable` on `/_next/static/*`
- `Cache-Control: public, max-age=86400, stale-while-revalidate=3600` on `/sitemap.xml` and `/robots.txt`

---

## Phase 2: Structured Data

### JsonLdSchema Component

`src/components/seo/JsonLdSchema.tsx` is a client component that injects JSON-LD into `<head>` via
`useEffect`. Used in root layout for global schemas that apply to every page.

For server components (blog posts), JSON-LD is rendered as an inline `<script type="application/ld+json">` tag using React's inner HTML prop. This is safe because the content is
`JSON.stringify()` of internally constructed schema objects — never user-supplied input.

### Schemas Deployed

| Schema           | Location                                          | Purpose                                    |
| ---------------- | ------------------------------------------------- | ------------------------------------------ |
| `Organization`   | `src/app/layout.tsx`                              | Brand identity for Google Knowledge Panel  |
| `WebApplication` | `src/app/layout.tsx`                              | Rich results for app-type queries          |
| `FAQPage`        | `src/app/practice/[slug]/ProblemDetailClient.tsx` | "How do I solve X?" queries                |
| `Article`        | `src/app/blog/[slug]/page.tsx`                    | Blog rich results, AI citation eligibility |

---

## Phase 3: Problem Detail Server Conversion

The original `practice/[slug]/page.tsx` was a client component that fetched problem data via
`useEffect`. This blocked `generateMetadata` (which requires a server component).

**Solution:** Split into two files:

- `page.tsx` — server component that fetches data via Prisma and exports `generateMetadata`
- `ProblemDetailClient.tsx` — client component that receives the problem as a prop and handles UI

```ts
// page.tsx (server)
export async function generateMetadata({ params }) {
  const problem = await getProblemBySlug(params.slug);
  return { title: problem.title, description: '...' };
}

export default async function ProblemPage({ params }) {
  const problem = await getProblemBySlug(params.slug);
  return <ProblemDetailClient problem={problem} />;
}
```

The `getProblemBySlug` and `getAllProblemsPublic` functions live in `src/lib/seo/problems.ts` to
keep them separate from the main app data layer.

---

## Phase 4: Content Infrastructure

### File-Based Content

Blog posts and docs are Markdown files in `src/content/` with YAML frontmatter:

```
---
title: "..."
description: "..."
publishedAt: "2026-03-01"
tags: ["patterns", "leetcode"]
---
```

The `src/lib/content.ts` module provides:

- `getAllPosts(type)` — reads all `.md` files from `src/content/{type}/`, sorted by `publishedAt` desc
- `getPostBySlug(slug, type)` — reads a single file

Both are filesystem reads — no DB, no API calls.

### Blog Routes

- `/blog` — `src/app/blog/page.tsx` — server component, calls `getAllPosts('blog')` at render time
- `/blog/[slug]` — `src/app/blog/[slug]/page.tsx` — server component with `generateMetadata` + `generateStaticParams`

`generateStaticParams` pre-generates all blog post pages at build time.

### Docs Routes

- `/docs` and `/docs/[slug]` — `src/app/docs/[[...slug]]/page.tsx` — catch-all route, defaults to `getting-started`

---

## Phase 5: GEO / AI Search Optimization

### llms.txt (`public/llms.txt`)

Served at `https://sophoco.de/llms.txt`. Follows the emerging llms.txt standard (inspired by
Jeremy Howard's proposal). Describes the site in plain text for AI crawlers, lists key pages and
blog posts, and explains technical characteristics relevant to AI systems (Pyodide, progressive
hints, no-spoiler policy).

### Article Schema on Blog Posts

Each blog post server component renders an inline JSON-LD `Article` schema with fields:
`headline`, `description`, `datePublished`, `dateModified`, `author`, `publisher`, `mainEntityOfPage`.

This makes blog posts eligible for Google AI Overviews, Perplexity citations, and ChatGPT web
references.

---

## Adding New Content

### New blog post

1. Create `src/content/blog/your-slug.md` with required frontmatter (`title`, `description`, `publishedAt`)
2. The post automatically appears in `/blog`, the sitemap, and gets its own page with correct metadata

### New docs page

1. Create `src/content/docs/your-slug.md`
2. The page is accessible at `/docs/your-slug` and appears in the sidebar nav automatically

### New problem (from DB)

Problems are queried from Prisma. No code changes needed — `getAllProblemsPublic` and
`getProblemBySlug` pick them up automatically. The sitemap regenerates on the next request/build.
