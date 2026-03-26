# Security

> **Status: Beta — significant security gaps exist.** This document catalogs known vulnerabilities and required mitigations before production hardening.

---

## 1. Summary

| Area                         | Status                 | Severity  |
| ---------------------------- | ---------------------- | --------- |
| Rate limiting                | None                   | Critical  |
| API route authentication     | None enforced          | Critical  |
| Guest ID data isolation      | Insecure               | Critical  |
| Caching                      | None                   | Medium    |
| AI endpoint abuse protection | None                   | Critical  |
| Code execution sandboxing    | Browser-only (Pyodide) | Low (MVP) |

**Bottom line:** The authentication infrastructure exists (Supabase OAuth, guest IDs, middleware) but is **not enforced on any API route**. All 14 API endpoints are publicly accessible with zero auth or rate limiting.

---

## 2. Authentication Gap

### 2.1 Middleware Does Not Enforce Auth

The Supabase middleware (`src/middleware.ts`, `src/lib/supabase/middleware.ts`) only refreshes sessions — it always calls `NextResponse.next()` regardless of whether a session exists. It never blocks unauthenticated requests.

### 2.2 Unprotected API Routes

All 14 API endpoints accept requests without authentication:

| Endpoint                      | Method     | Risk                                    |
| ----------------------------- | ---------- | --------------------------------------- |
| `/api/runs`                   | POST       | Records fake test runs                  |
| `/api/problems`               | GET        | Reads all problems                      |
| `/api/problems/[slug]`        | GET        | Reads problem details                   |
| `/api/progress`               | GET        | Reads any user's progress               |
| `/api/sessions`               | POST       | Creates sessions with arbitrary guestId |
| `/api/sessions/[id]`          | GET, PATCH | Reads/modifies any session              |
| `/api/sessions/[id]/hints`    | POST       | Generates hints for any session         |
| `/api/sessions/[id]/complete` | POST       | Completes any session                   |
| `/api/sessions/[id]/snapshot` | PATCH      | Overwrites any session's code           |
| `/api/ai/chat`                | POST       | Unlimited AI chat calls                 |
| `/api/ai/summary`             | POST       | Unlimited AI summary calls              |
| `/api/ai/explain`             | POST       | Unlimited AI explain calls              |
| `/api/ai/hint`                | POST       | Unlimited AI hint calls                 |

### 2.3 Guest ID Insecurity

The guest ID system provides no ownership verification. Any user can:

- Access or modify another user's progress by supplying their `guestId` in requests.
- Read or modify sessions belonging to other guests.
- Create sessions with arbitrary `guestId` values.

**Mitigation:** API routes must verify that the requesting user (authenticated session or guest header) owns the resource being accessed.

---

## 3. Rate Limiting

**Status:** None implemented.

- No references to `@upstash/ratelimit`, in-memory buckets, or token systems.
- `DEPLOY.md` explicitly notes: "Rate limiting is in-memory (not shared across serverless instances). Use @upstash/ratelimit for production."
- AI endpoints are the highest risk — each call hits OpenRouter, incurring real cost.

**Recommended:**

| Route type              | Limit                     | Implementation       |
| ----------------------- | ------------------------- | -------------------- |
| AI routes (`/api/ai/*`) | 10-20 req/min per user/IP | `@upstash/ratelimit` |
| Session CRUD            | 30 req/min per user       | `@upstash/ratelimit` |
| Problem listing         | 60 req/min per IP         | Cache + rate limit   |

---

## 4. Caching

**Status:** None implemented.

- No Redis, Edge Config, Memcached, or external caching.
- No `Cache-Control` headers on any API responses.
- No client-side data caching (SWR, React Query, etc.).
- No Next.js `revalidate`, `unstable_cache`, or fetch-caching strategies.
- Only `localStorage` usage for guest ID and onboarding flags.

**Recommended:**

| Data           | Strategy                                     |
| -------------- | -------------------------------------------- |
| Problem list   | `Cache-Control: public, max-age=300` (5 min) |
| Problem detail | `stale-while-revalidate=60`                  |
| Progress data  | SWR with 30s revalidation                    |

---

## 5. AI Endpoint Exposure

All four AI routes (`/api/ai/{chat,hint,explain,summary}`) have:

- Basic validation of required fields (returns 400 on missing data).
- Check that `OPENROUTER_API_KEY` is set (returns 503 if not).
- **No rate limiting, IP tracking, or call quotas.**
- **No user authentication.**
- Direct calls to OpenRouter on every request.

**Risk:** Unlimited API usage would incur unbounded costs on the OpenRouter account.

---

## 6. Code Execution

Python runs entirely client-side via Pyodide (WebAssembly). This is safe from a server perspective — there is no server-side code execution surface.

**Known limitation:** Hidden test cases can be bypassed client-side since Pyodide runs in the browser. The test case data is sent to the worker, so a determined user could inspect network traffic or worker messages to see expected outputs. Server-side execution is a post-MVP upgrade.

---

## 7. Required Mitigations (Pre-Production)

1. **Enforce authentication on all API routes** — check Supabase session or valid guest header; reject unauthorized requests with 401.
2. **Add ownership verification** — verify that the requesting user/guest owns the resource (session, progress, etc.) before allowing access.
3. **Implement rate limiting** — start with `@upstash/ratelimit` on AI routes, then extend to all endpoints.
4. **Add caching headers** — `Cache-Control` on read-heavy endpoints (problems, progress).
5. **Add AI call quotas** — track per-user AI usage and enforce daily/weekly limits.
6. **Audit middleware** — ensure Supabase middleware blocks unauthenticated access to protected routes.
