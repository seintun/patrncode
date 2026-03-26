# Deployment Checklist

## Pre-Deploy

- [ ] Set all environment variables in Vercel dashboard:
  - `DATABASE_URL` (Supabase pooled: port 6543)
  - `DIRECT_URL` (Supabase direct: port 5432)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  - `OPENROUTER_API_KEY`

- [ ] Run DB migration: `bunx prisma migrate deploy` (from CI or locally with DIRECT_URL)
- [ ] Run seed: `bunx prisma db seed`
- [ ] Enable GitHub + Google OAuth in Supabase dashboard
- [ ] Add Supabase redirect URL: `https://sophoco.de/auth/callback`

## Deploy to Vercel

1. Connect GitHub repo: https://vercel.com/new
2. Framework preset: Next.js (auto-detected)
3. Build command: `bun run build`
4. Install command: `bun install`
5. Output dir: `.next`
6. Add all env vars from above

## Post-Deploy

- [ ] Verify `/` shows landing page
- [ ] Verify `/practice` shows 8 problems
- [ ] Test session creation (guest mode)
- [ ] Test AI hints (requires OPENROUTER_API_KEY)
- [ ] Test auth (requires Supabase OAuth config)
- [ ] Run Lighthouse audit (target 90+)
- [ ] Configure custom domain: `sophoco.de`

## Known Limitations (MVP)

- Rate limiting is in-memory (not shared across serverless instances). Use @upstash/ratelimit for production.
- Pyodide ~20MB first load — consider preloading in service worker post-MVP.
- Hidden test cases can be bypassed client-side (Pyodide runs in browser). Server-side execution is a post-MVP upgrade.
