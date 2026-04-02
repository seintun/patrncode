# Changelog

## 0.3.0

### Minor Changes

- Prepare and publish v0.3.0 release from main.

### Patch Changes

- 9b8558f: Fix onboarding/practice loading by adjusting proxy CSP/header forwarding and address Wave 3 review feedback across recommendations, report parsing, settings UX, and profile/settings API consistency.
- 73a407c: Fix CSP violations that blocked Pyodide, Monaco Editor, and React hydration in production. Set CSP nonce on request headers before SSR, add cdn.jsdelivr.net to CSP directives, and fix Monaco accessibility overlay and loading placeholder.
- 515a02b: Harden wave 3 AI tutor safety and data integrity by sanitizing prompt inputs/selected AI outputs, fixing pattern weakness success accounting, and adding focused coverage for wave 3 UI and cache modules.
- 07e1cb1: Fix End Session blocking delay: move AI feedback generation to background using Next.js `after()`, add feedback polling placeholder on summary page. Session now completes in <500ms instead of 5-15s.

## 0.2.1

### Patch Changes

- docs: maintenance refresh across architecture, security, onboarding, and contributor guides
  - Updated auth/runtime narrative from legacy localStorage + middleware references to current proxy + httpOnly guest cookie flow
  - Synced security and roadmap docs with implemented auth ownership and rate-limit controls
  - Refreshed database and AI docs for current schema/model defaults and env-configured model IDs
  - Updated README/CONTRIBUTING/getting-started messaging and setup commands for current `0.2.x` workflow

## 0.2.0

### Minor Changes

- feat(security,perf): Comprehensive Security & Performance Hardening
  - Migrated guest ID to server-side httpOnly cookies (replacing localStorage)
  - Added session ownership validation across all session API routes
  - Implemented Upstash Redis rate limiting (20 req/min) on AI endpoints
  - Configured security headers and report-only CSP
  - Introduced API HOCs (withAuth, withValidIdParams, withAuthAndId) reducing route handler boilerplate by ~50%
  - Optimized Pyodide WASM prewarming on problem page mount
  - Added tiered Cache-Control headers and ISR for problem pages
  - Removed `uuid` package in favor of native `crypto.randomUUID()`

- feat: floating Sophia avatar with coach panel toggle
  - Added FloatingSophia component with 40px avatar circle and typewriter speech bubbles
  - Created useFloatingSophia hook with 8 mode-aware triggers and 90s cooldown
  - Coach panel hidden by default on desktop with smooth grid transition toggle (30/70 to 30/40/30)
  - Added Cmd+Shift+S keyboard shortcut to toggle coach panel
  - Contextual nudges for test failures, idle time, session start, and completion
  - Mobile: avatar above tab bar, click switches to Coach tab and opens sheet

- feat(coaching): Sophia behavioral awareness, hint UX, and coaching panel redesign
  - Added behavioral awareness triggers (code length, test run count, active tab tracking)
  - Redesigned hint CTA card with icon, description, and gradient button
  - Enhanced assistant message bubbles with subtle borders and shadows
  - Added Sophia prose markdown renderer with custom styles
  - Implemented persistent hint history and session restore across reloads
  - Added 3-minute cooldown with countdown for next hint level
  - Externalized coach/summary model configuration to environment variables
  - Implemented strict topical guardrails across all prompt templates
  - Enabled full code editor context for Sophia coaching chat
  - Redesigned test error UI with improved line mapping accuracy
  - Fixed pyodide-worker codeLineOffset for correct line number calculation

- feat: session lifecycle management with Pro-Max UI features
  - Added `expiresAt` and `duration` fields to Session model with 45-minute default
  - Enforced "one active session per problem" rule (409 on duplicate)
  - Session extension adds 15 minutes from max(expiresAt, now)
  - Added resume flow with "Resume" or "End" session options
  - Timer urgency animations (glow/pulse) for < 5 minutes remaining
  - Glassmorphism expiration overlay with "View Final Summary"
  - "End Session" confirmation modal with destructive action button
  - Auto-clear expired sessions from resume UI when countdown reaches zero
  - Added comprehensive API tests for sessions endpoint (10 new tests)

### Patch Changes

- fix: resolve hidden bottom tab bar on mobile browsers by switching to dvh units
- fix: resolve chat response latency and stuck UI during reasoning
- fix: reinforce grid column constraints and internal panel scrolling
- fix: resolve react hooks violations in session lifecycle components
- fix: address all Copilot review threads and CI lint errors

## 0.1.3

### Patch Changes

- fix: address all Copilot PR review comments for mobile workspace and execution reliability
- fix: resolve hidden bottom tab bar on mobile browsers by switching to dvh units

## 0.1.2

### Patch Changes

- c62f956: feat: integrate Sophia persona across coaching UI and prompts
  - Add centralized config with per-mode colors, voice rules, vocabulary, and scene images
  - Inject voice constraints into prompt files (coach, interviewer, hint, summary)
  - Update CoachingPanel with mode-colored bubbles, inline avatar, status line, and scene images
  - Pass session mode through API routes for mode-aware AI behavior
  - Improve practice page mobile layout and badge stacking

- bc0e424: feat(mobile): improve mobile workspace with bottom nav, Run tab, and tab-swapping views

## 0.1.1

### Patch Changes

- 969e021: fix: chat and pyodide error messages
  - Fix chat 404: use DefaultChatTransport in useChat v3
  - Fix chat 400: force chat completions API (OpenRouter lacks Responses API)
  - Fix chat validation: validate messages array and problem context fields
