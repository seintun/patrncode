# SEO — Monitoring & Audits

## Google Search Console

### Setup

1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add property: **URL prefix** → `https://sophoco.de`
3. Verify via one of:
   - **HTML file** — download and place in `public/` (e.g. `public/google<token>.html`)
   - **HTML meta tag** — add `verification` to `metadata` in `src/app/layout.tsx`:
     ```ts
     verification: {
       google: 'your-token-here';
     }
     ```
4. Submit sitemap: **Sitemaps** → `https://sophoco.de/sitemap.xml`

### What to Monitor Weekly

| Signal            | Where                        | Target                   |
| ----------------- | ---------------------------- | ------------------------ |
| Total clicks      | Performance → Search results | +10% MoM                 |
| Total impressions | Performance → Search results | Growing                  |
| Average CTR       | Performance → Search results | > 3%                     |
| Average position  | Performance → Search results | < 20 for target keywords |
| Index coverage    | Indexing → Pages             | 0 errors                 |
| Core Web Vitals   | Experience → Core Web Vitals | All green                |

### Key Queries to Track

Set up filters in Search Console for these queries:

- `coding interview patterns`
- `coding interview practice`
- `clarify plan code reflect`
- `progressive hints coding`
- `leetcode patterns`
- `algorithm patterns interview`

### Alerts

- Set up email alerts for **manual actions** and **security issues** (Settings → Email preferences)

---

## Vercel Analytics

Already integrated via `@vercel/analytics` in root layout. No additional setup required — data
appears in the Vercel dashboard under the project → Analytics tab.

Tracks: page views, unique visitors, bounce rate, top pages. No additional configuration needed
for basic web analytics.

---

## GA4 (Google Analytics 4)

### Setup

1. Create a GA4 property at [analytics.google.com](https://analytics.google.com)
2. Get the Measurement ID (format: `G-XXXXXXXXXX`)
3. Install the Next.js GA4 integration:

```bash
bun add @next/third-parties
```

4. Add to `src/app/layout.tsx`:

```tsx
import { GoogleAnalytics } from '@next/third-parties/google';

// Inside RootLayout return, after <Analytics />:
<GoogleAnalytics gaId="G-XXXXXXXXXX" />;
```

### Events to Track

Add these custom events as features are built:

| Event              | When to fire                     | Parameters                              |
| ------------------ | -------------------------------- | --------------------------------------- |
| `session_start`    | User begins a coding session     | `problem_slug`, `mode`, `pattern`       |
| `hint_requested`   | User requests a hint             | `problem_slug`, `hint_level` (1/2/3)    |
| `code_run`         | User runs their code             | `problem_slug`, `passed` (bool)         |
| `session_complete` | User completes a session         | `problem_slug`, `outcome`, `hints_used` |
| `blog_read`        | User scrolls 80%+ of a blog post | `post_slug`                             |

Implement using `gtag('event', ...)` or via `@next/third-parties` `sendGAEvent`.

---

## Audit Schedule

### Monthly (30 min)

- [ ] Check Search Console coverage report — fix any "Excluded" pages that should be indexed
- [ ] Review top queries — identify new keywords gaining impressions
- [ ] Check Core Web Vitals report — investigate any "Poor" URLs
- [ ] Verify sitemap is returning HTTP 200 and contains expected URL count
- [ ] Run `bunx tsc --noEmit` to catch any broken metadata types

### Quarterly (2 hours)

- [ ] Run Lighthouse audit on `/`, `/practice`, `/blog` — target 90+ on all four metrics
- [ ] Review backlink profile in Search Console → Links
- [ ] Check if any new blog posts need internal links added
- [ ] Update `docs/seo/content-strategy.md` with new keyword opportunities
- [ ] Review and refresh blog post titles/descriptions if CTR is below 2%

### Lighthouse Targets

| Metric         | Target |
| -------------- | ------ |
| Performance    | ≥ 90   |
| Accessibility  | ≥ 95   |
| Best Practices | ≥ 95   |
| SEO            | 100    |

Run locally:

```bash
# Start prod build
bun run build && bun run start

# Then open Chrome DevTools → Lighthouse on localhost:3000
```

Or use the Vercel deployment URL for more realistic network conditions.

---

## Core Web Vitals Reference

| Metric                          | Good    | Needs Improvement | Poor    |
| ------------------------------- | ------- | ----------------- | ------- |
| LCP (Largest Contentful Paint)  | < 2.5s  | 2.5–4s            | > 4s    |
| INP (Interaction to Next Paint) | < 200ms | 200–500ms         | > 500ms |
| CLS (Cumulative Layout Shift)   | < 0.1   | 0.1–0.25          | > 0.25  |

**Known risks:**

- Monaco Editor lazy-loads — ensure it doesn't cause CLS on the session page
- Pyodide (~20MB) loads lazily — should not affect LCP on marketing/blog pages

---

## Structured Data Validation

After any schema changes, validate with:

- [Google Rich Results Test](https://search.google.com/test/rich-results) — tests live URL or HTML
- [Schema.org Validator](https://validator.schema.org) — validates JSON-LD directly

Schemas currently deployed: Organization, WebApplication, FAQPage (on problem pages), Article (on blog posts).
