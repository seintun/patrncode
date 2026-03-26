# Design System

## 1. UX Principles

patrncode is a learning and practice tool for stressed new grads and busy engineers. The UX must:

- **Reduce anxiety** rather than amplify it.
- **Emphasize clarity and process** (clarify → plan → reason → code → test → reflect).
- **Keep cognitive load low**, especially for beginners unfamiliar with DSA and Big-O.
- **Highlight progress and growth**, not just pass/fail.

Key principles:

1. **Calm, focused visuals** — primarily cool colors (blue/teal) and soft neutrals with minimal, purposeful accents.
2. **Process-first flows** — every session guides the user through a sequence, not just "dump a problem and editor."
3. **Progressive disclosure** — hints, solutions, and formal Big-O explanations appear only when requested.
4. **High accessibility** — color contrast and typography tuned for long reading and coding sessions.

---

## 2. Color Palette and Tokens

### 2.1 The 60-30-10 Color System

The design follows a **60-30-10 rule** for a consistent dark-first UI that balances analytical focus with a calm learning environment.

| Layer               | Color         | HEX       | Role                                                 |
| ------------------- | ------------- | --------- | ---------------------------------------------------- |
| **Dominant (60%)**  | Deep Ink      | `#0F172A` | Page background, reduces eye strain, "premium" feel  |
| **Secondary (30%)** | Slate         | `#1E293B` | Cards, panels, distinguishes regions without clutter |
| **Accent (10%)**    | Electric Cyan | `#22D3EE` | Interactive elements, CTAs, highlights               |

### 2.2 Full Token Set (globals.css)

These tokens are defined via Tailwind v4's `@theme` directive in `src/app/globals.css`:

**Backgrounds:**

| Token                  | Value     | Usage                                |
| ---------------------- | --------- | ------------------------------------ |
| `--color-bg-primary`   | `#0F172A` | Page background (Deep Ink)           |
| `--color-bg-secondary` | `#1E293B` | Card/panel backgrounds (Slate)       |
| `--color-bg-elevated`  | `#334155` | Modals, dropdowns, elevated surfaces |
| `--color-bg-editor`    | `#0F172A` | Monaco editor background             |

**Accent:**

| Token                  | Value     | Usage                                            |
| ---------------------- | --------- | ------------------------------------------------ |
| `--color-accent`       | `#22D3EE` | Primary interactive elements (Electric Cyan)     |
| `--color-accent-hover` | `#06B6D4` | Hover state for accent                           |
| `--color-ai-coach`     | `#818CF8` | AI chat bubbles (Digital Lavender — tranquility) |

**Feedback:**

| Token                | Value     | Usage                                                  |
| -------------------- | --------- | ------------------------------------------------------ |
| `--color-success`    | `#10B981` | Tests passing, positive states                         |
| `--color-warning`    | `#F59E0B` | High hint usage, caution                               |
| `--color-error`      | `#EF4444` | Test failures, syntax errors                           |
| `--color-error-soft` | `#FDA4AF` | Inline error underlines (Soft Crimson — less alarming) |

**Big-O Traffic Light** (aliases for feedback colors):

| Token                 | Alias             | Meaning                      |
| --------------------- | ----------------- | ---------------------------- |
| `--color-bigo-green`  | `--color-success` | O(1) — "The Instant Fix"     |
| `--color-bigo-yellow` | `--color-warning` | O(log n) — "The Single Pass" |
| `--color-bigo-red`    | `--color-error`   | O(n²) — "The Double Check"   |

**Text:**

| Token                    | Value     | Usage                            |
| ------------------------ | --------- | -------------------------------- |
| `--color-text-primary`   | `#F1F5F9` | Main text on dark backgrounds    |
| `--color-text-secondary` | `#94A3B8` | Descriptions, secondary labels   |
| `--color-text-muted`     | `#64748B` | Hints, timestamps, tertiary info |

**Borders:**

| Token                   | Value     | Usage             |
| ----------------------- | --------- | ----------------- |
| `--color-border`        | `#334155` | Standard borders  |
| `--color-border-subtle` | `#1E293B` | Subtle separators |

### 2.3 Design Decisions

- **80–90% of the UI** uses neutrals + cool tones; warm accents reserved for primary CTAs and positive reinforcement.
- **Red is reserved for errors** — avoid full red backgrounds to reduce intimidation.
- **Digital Lavender (`#818CF8`)** for AI chat bubbles — psychologically associated with tranquility, lowering user anxiety during coaching.
- **Soft Crimson (`#FDA4AF`)** for error underlines — visible enough to catch syntax errors but muted to avoid "error anxiety."

---

## 3. Typography

- **Primary font:** Clean, legible sans-serif (Inter, SF Pro, or system default).
- **Code font:** Monospaced (JetBrains Mono, Fira Code) in editor and inline snippets.

**Hierarchy:**

| Level | Usage                        | Notes                                     |
| ----- | ---------------------------- | ----------------------------------------- |
| H1/H2 | Top-level views only         | Used sparingly                            |
| H3/H4 | Section titles within panels |                                           |
| Body  | 14–16px equivalent           | Line height 1.5–1.7 for long explanations |

---

## 4. Information Architecture

### 4.1 Main Areas

- **Home / Dashboard** — Today's recommended session, quick stats (streak, problems mastered, patterns practiced).
- **Practice** — Problem list with filters (pattern, difficulty, mastery, source). Entry points: "Start Practice," "Retest," or "Mock Interview."
- **Session View** (core screen) — Left: problem statement panel. Center: Monaco code editor + I/O. Right: hints & coaching chat.
- **Profile / Progress** — Topic heatmap, problem history, mastery states, settings.

### 4.2 Session Flow

1. **Select problem + mode** (Self-Practice / Coach Me / Mock Interview).
2. **Clarify & Restate** — pre-coding prompt to restate the problem.
3. **Plan** — optional structured text box for approach outline.
4. **Code & Test** — editor + run tests; hints available per mode.
5. **Reflect** — AI summary + user notes.

---

## 5. Component Design

### 5.1 Primitives (`src/components/ui/`)

No data fetching. No side effects. Props-only. Fully reusable.

| Component           | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `Button.tsx`        | Primary, secondary, tertiary button variants |
| `Badge.tsx`         | Difficulty pills, mastery state indicators   |
| `Card.tsx`          | Content containers                           |
| `Input.tsx`         | Text inputs                                  |
| `Select.tsx`        | Dropdown selects                             |
| `Skeleton.tsx`      | Loading placeholders                         |
| `ErrorBoundary.tsx` | React error boundary                         |
| `ErrorFallback.tsx` | Error state UI                               |
| `AIBanner.tsx`      | AI-related notifications                     |

### 5.2 Domain Components (`src/components/domain/`)

May fetch data. May have side effects. May use hooks. Problem-specific.

| Component            | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `ProblemList.tsx`    | Filterable problem catalog                  |
| `CoachingPanel.tsx`  | AI chat interface                           |
| `SessionLayout.tsx`  | Three-panel session layout                  |
| `CodeEditor.tsx`     | Monaco wrapper (dynamic import, ssr: false) |
| `TestResults.tsx`    | Pass/fail test display                      |
| `ProblemPanel.tsx`   | Problem statement + examples                |
| `PatternHeatmap.tsx` | Mastery visualization                       |

### 5.3 Button States

- **Primary** (e.g., "Start session", "Run tests"): `--color-accent` background, white text. Hover: `--color-accent-hover`.
- **Secondary** (e.g., "View explanation"): Outline with `--color-accent` border and text.
- **Tertiary** (text links): Underlined or `--color-accent` with no fill.

### 5.4 Feedback States

- **Success** (tests all green): `--color-success` icons and banners. Copy emphasizes learning, not just "pass."
- **Warning** (high hint usage): `--color-warning` icons, neutral background. Avoid alarming reds.
- **Error** (syntax/runtime): Red underlines in editor via `--color-error-soft`. Error banner with `--color-error-soft` background and `--color-error` text.

---

## 6. Domain Types

The design system's data contracts are defined in `src/types/index.ts`:

```ts
type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
type Pattern = 'ARRAYS_STRINGS' | 'HASH_MAPS' | 'TWO_POINTERS' | ...; // 14 patterns
type MasteryState = 'UNSEEN' | 'IN_PROGRESS' | 'MASTERED' | 'NEEDS_REFRESH';
type SessionMode = 'SELF_PRACTICE' | 'COACH_ME' | 'MOCK_INTERVIEW';
type SessionStatus = 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
type SessionOutcome = 'SOLVED' | 'PARTIALLY_SOLVED' | 'NOT_SOLVED';
```

These types mirror the Prisma enums and are the canonical definitions used across components, hooks, and API routes.

---

## 7. Accessibility

- Target **WCAG AA** contrast (4.5:1) for all text and iconography.
- Avoid color-only communication — difficulty and status use labels and icons in addition to color.
- Provide clear focus states with visible outlines using `--color-accent` or `--color-ai-coach`.

---

## 8. Future Design Enhancements

- Dark mode for full shell (not just editor) once usage patterns are clear.
- Visual aids to teach complexity (e.g., tiny charts showing linear vs quadratic growth).
- Micro-interactions for milestones (e.g., subtle confetti when mastering a core problem).
