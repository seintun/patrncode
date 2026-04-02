# Security

> **Status: Beta, improving.** Core auth and rate limiting controls are implemented, with a few remaining hardening gaps documented below.

---

## 1. Summary

| Area                         | Status                                                        | Severity |
| ---------------------------- | ------------------------------------------------------------- | -------- |
| API auth wrappers            | Implemented on sensitive routes (`withAuth`, `withAuthAndId`) | Medium   |
| Session ownership checks     | Implemented (`requireOwnership`)                              | Medium   |
| AI endpoint rate limiting    | Implemented (`withRateLimit`)                                 | Medium   |
| Guest identity               | httpOnly cookie (`sophocode_guest`) via proxy                 | Medium   |
| Premium gating               | Implemented but feature-flagged default OFF                   | Low      |
| Code execution sandboxing    | Browser-only (Pyodide)                                        | Low      |
| AI quotas / spend controls   | Not fully implemented                                         | Medium   |
| Distributed RL fallback mode | In-memory fallback is per-instance                            | Medium   |

**Bottom line:** security posture is no longer "unprotected APIs." The app enforces route-level auth/ownership and rate limits in key paths, but still needs stronger quota controls and periodic boundary audits.

---

## 2. Current Enforcement Model

### 2.1 Proxy + Session Refresh Boundary

- Request entrypoint is `src/proxy.ts`.
- Supabase session refresh helper remains in `src/lib/supabase/middleware.ts`.
- Proxy also sets CSP headers and manages `sophocode_guest` httpOnly cookie.

### 2.2 Route-Level Auth and Ownership

- Auth wrappers and consistent error handling live in `src/lib/errors/api.ts`.
- Session/resource ownership checks are enforced via `src/lib/auth/session-auth.ts`.
- Premium endpoints are additionally gateable in `src/proxy.ts` (behind `PREMIUM_GATING_ENABLED`).

---

## 3. Rate Limiting

**Status:** implemented with `@upstash/ratelimit` via `src/lib/ratelimit.ts` and `withRateLimit` wrappers.

- AI routes currently use a shared API rate-limit bucket (`RATE_LIMITS.API`) through `withRateLimit`.
- Fallback mode can still use local in-memory behavior when managed Redis is unavailable.

**Remaining gap:** fallback mode is not globally shared across serverless instances, so abuse protection is weaker than centralized Redis-backed enforcement.

---

## 4. Caching

**Status:** mixed.

- Read-heavy pages and APIs include targeted caching/perf improvements from recent waves.
- Caching strategy is not yet fully standardized across all read endpoints.

**Remaining gap:** some endpoints still rely on default behavior instead of an explicit cache policy matrix.

---

## 5. AI Endpoint Exposure

Current AI routes (`/api/ai/{chat,hint,explain,summary,generate-problem}`):

- Validate request payloads.
- Check model provider configuration.
- Apply route-level rate limiting.
- Enforce prompt and output safety constraints.

**Remaining gap:** no complete per-user daily/weekly quota ledger for spend governance.

---

## 6. Code Execution

Python runs client-side via Pyodide (WebAssembly). There is no server-side arbitrary code execution surface.

**Known limitation:** hidden test behavior remains observable to determined users in browser-executed mode. Server-side sandbox execution is still the long-term anti-cheat path.

---

## 7. Next Hardening Priorities

1. Add explicit AI usage quotas (per user/guest and per time window).
2. Standardize cache headers/revalidation policy for all read endpoints.
3. Add periodic endpoint audit checklist for auth + ownership wrappers.
4. Keep premium-route gating and auth boundaries aligned as feature flags evolve.
