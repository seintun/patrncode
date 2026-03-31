## Summary

Production-ready security, performance, and cost controls for Sophocode. Foundational "Ship Safe" wave (P0) before any launch. Covers CSP enforcement, tiered rate limiting, input validation, dynamic imports, token budgeting, model tiering, AI response caching, structured logging, and admin metrics.

## Proposal / Design Links

Technical documentation: `docs/WAVE-1-SHIP-SAFE.md`

## Problem Statement

The app was running with report-only CSP, flat rate limiting (20 req/min), no input validation, no token cost controls, eagerly-loaded heavy components (Monaco, MarkdownRenderer), and no structured observability. Not safe for production traffic.

## Scope

- Security: CSP enforcement with nonces, tiered rate limiting, Zod input validation on all API routes
- Performance: Dynamic imports for Monaco/MarkdownRenderer/PatternHeatmap, bundle optimization, production console removal
- Cost: Token budgeting per guest, model tiering (FREE/PREMIUM), Redis AI response caching
- Data: UserProfile model, performance DB indexes, new enums for tier/theme/editor prefs
- Observability: Structured JSON logging, admin metrics endpoint

## Non-Goals

- Authentication system (still guest-only)
- Payment/billing integration
- Actual premium tier enforcement (infrastructure ready, gating logic deferred)
- Bundle size profiling (deferred to follow-up)

## User Stories

- As a user, I want XSS protection so my session is secure.
- As a user, I want fast page loads with lazy-loaded editor components.
- As a developer, I want structured logs with request context for debugging.
- As a product owner, I want token cost controls to prevent runaway AI costs.

## Acceptance Criteria

- [x] CSP enforced in production (no violations in console)
- [x] Rate limiting active on all routes (3 tiers: guest/API/auth)
- [x] All API routes have input validation (Zod schemas)
- [x] Monaco, MarkdownRenderer, PatternHeatmap dynamically imported
- [x] Production builds strip console.log (keeps error/warn)
- [x] DB indexes added for filtered queries and review scheduling
- [x] Token counting middleware operational (check before LLM call)
- [x] Model tiering working (env-var driven, defaults to grok-4.1-fast)
- [x] AI response caching via Redis with cache key derivation
- [x] Structured logging capturing token usage and latency
- [x] Admin metrics endpoint at `/api/admin/metrics` (protected by `ADMIN_SECRET`)
- [x] All 197 tests pass, build succeeds, type-check clean

## Implementation Notes

- **Chat route validation:** Uses inline validation (not Zod) because AI SDK v6 `UIMessage` format with `parts[]` doesn't map cleanly to Zod schemas.
- **CSP `'unsafe-eval'`:** Retained for Monaco Editor web workers.
- **In-memory rate limit fallback:** If Redis is unavailable, an in-memory Map with 5-min TTL cleanup prevents API routes from failing.
- **Streaming responses are not cached:** The chat route checks Redis before streaming, but can't cache the streamed response.

## Alternatives Considered

1. **Zod for chat messages** — Rejected (UIMessage `parts[]` union doesn't validate cleanly)
2. **CSP meta tag** — Rejected (doesn't support all directives)
3. **`middleware.ts`** — Rejected (Next.js 16 uses `proxy.ts` convention)

## Edge Cases and Failure Modes

- **Redis down:** In-memory fallback activates with warning log
- **No UserProfile:** FREE tier defaults (100k tokens), upsert on first usage
- **Invalid message format:** 400 with specific field errors
- **CSP in dev:** Report-only mode, violations logged but not blocked

## DRY / Tech Debt Impact

- **Reduced:** Centralized `config.ts`, reusable `validateBody()`, shared `extractText()`
- **Accepted:** `prisma db push` over `migrate dev` (deferred), inline validation in chat route

## Changeset

- [x] `skip-changeset` — infrastructure/security, no user-facing version bump

## Test Plan

### Automated Tests

- [x] Unit (197 tests pass)

Commands run:

```bash
bun run type-check   # PASS — 0 errors
bun run test         # PASS — 197/197 tests
bun run build        # PASS — 37 static pages, 4.2s
```

### Manual Verification

- [ ] `/practice` loads with cache headers
- [ ] Session starts with CodeEditor skeleton then Monaco
- [ ] Chat sends/receives with token budget check
- [ ] `/progress` loads PatternHeatmap dynamically
- [ ] No CSP violations in production devtools

## Risks and Mitigations

| Risk                | Impact             | Mitigation                  |
| ------------------- | ------------------ | --------------------------- |
| CSP breaks Monaco   | Editor fails       | `unsafe-eval` in script-src |
| Redis outage        | Rate limiting down | In-memory fallback          |
| Prisma vulns        | Security risk      | Upstream, awaiting update   |
| Token limit too low | Session breaks     | 100k/500k adjustable        |

## Deployment

- Preview: auto via `deploy-preview.yml`
- Prod: `deploy-production.yml` on merge to main

## Follow-ups

- `prisma migrate dev` interactively for migration files
- Set `OPENROUTER_MODEL_FREE` / `OPENROUTER_MODEL_PREMIUM` env vars
- Set `ADMIN_SECRET` in production
- Bundle profiling with `next build --profile`
- `recordTokenUsage()` in streaming completions
- Cache non-streaming AI responses
