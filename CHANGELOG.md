# Changelog

## 0.1.3

### Patch Changes

- fix: resolve hidden bottom tab bar on mobile browsers by switching to dvh units

## 0.1.2

### Patch Changes

- fix: resolve hidden bottom tab bar on mobile browsers by switching to dvh units
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
  - Improve pyodide errors: dynamic line offset, traceback formatting, filter internals

All notable changes to sophocode are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## 0.1.0 (2026-03-26)

First stable release of **Sophocode** — an AI-powered Python coding practice platform built for technical interview preparation.

### Core Platform

- Guest-first anonymous sessions via localStorage (no sign-up required to start)
- Three-panel session layout: problem description | Monaco code editor | AI coaching chat
- Supabase authentication for persisting progress across devices
- Spaced repetition mastery tracking (UNSEEN → LEARNING → REVIEW → MASTERED → NEEDS_REFRESH)

### Code Execution

- Pyodide WASM runtime for in-browser Python execution (no backend round-trips)
- Web Worker isolation for safe, non-blocking code runs
- Per-test-case result reporting with pass/fail breakdown
- 5-second timeout guard per test case

### AI Coaching

- Sophia AI coach powered by Vercel AI SDK + OpenRouter streaming
- Contextual hints, explanations, and failure analysis
- "Why did this fail?" quick-action on test failures

### Content & UX

- Curated problem set with difficulty (Easy / Medium / Hard) and pattern tags
- Pattern heatmap showing mastery distribution across 14 algorithmic patterns
- Mobile-responsive navbar with hamburger menu
- Full accessibility pass: ARIA labels, keyboard navigation, semantic HTML, focus management
- Progressive Web App (PWA) support with offline caching via service worker
- Dark design system with 60-30-10 color ratio and CSS design tokens

### Infrastructure

- Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS v4
- Prisma 7 ORM with Supabase Postgres
- Vitest unit tests + Playwright E2E test infrastructure (~80% unit coverage on targeted modules)
- Conventional commits enforced via commitlint + Husky
- Changesets-based versioning and changelog automation
- GitHub Actions CI: lint, format, typecheck, unit tests, E2E, changeset check
- Vercel preview and production deployment workflows with automated PR comments
