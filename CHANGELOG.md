# Changelog

## 0.2.1

### Patch Changes

- 4ece3b9: feat: floating Sophia avatar with coach panel toggle
- a71e256: fix: resolve hidden bottom tab bar on mobile browsers by switching to dvh units
- 3a94413: Implemented comprehensive security and performance hardening, including server-side guest cookies, session ownership validation, UUID validation, AI endpoint rate limiting, and Pyodide preloading.

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
