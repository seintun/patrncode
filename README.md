# sophocode

AI-coached coding interview practice. Learn patterns, not just problems.

**[sophoco.de](https://sophoco.de)** · [Architecture](ARCHITECTURE.md) · [Contributing](.github/CONTRIBUTING.md)

> **Beta** (`0.1.0-beta.x`) — APIs and data models may change between commits.

---

## What It Is

sophocode is a session-based Python algorithm practice platform with an AI coach that teaches through Socratic questioning — never giving away solutions. Users practice curated DSA problems, get progressive hints, and build mastery through spaced repetition.

**Three session modes:**

- **Self-Practice** — hints off or delayed, work at your own pace
- **Coach Me** — AI coach available on demand, guiding with questions
- **Mock Interview** — simulated interview with probing follow-ups

**Core loop:** Clarify → Plan → Code → Reflect

---

## Features

- **Zero-friction entry** — start practicing immediately, no sign-up required. Guest data migrates to your account when you're ready.
- **In-browser Python** — code runs via Pyodide (WebAssembly), no server sandbox needed. Instant feedback, works offline after first load.
- **Progressive hints** — 3 levels (direction → approach → specific) that never spoil the solution.
- **Pattern-based learning** — master 14 DSA patterns (Two Pointers, Sliding Window, BFS/DFS, DP, etc.), not memorize 1000 problems.
- **Spaced repetition** — problems resurface based on mastery state and review intervals.
- **AI coaching** — five specialized prompt contexts (explanation, hint, coach, interviewer, summary) powered by OpenRouter.
- **Mastery heatmap** — visualize your pattern coverage on the dashboard.

---

## Quick Start

```bash
# Prerequisites: Bun ≥ 1.1.0, Node ≥ 20

git clone <repo-url>
cd sophocode
bun install

# Set up environment
cp .env.example .env.local
# Fill in: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
#          DATABASE_URL, DIRECT_URL, OPENROUTER_API_KEY

# Database
bunx prisma migrate dev
bunx prisma db seed

# Run
bun dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page is at `src/app/(marketing)/page.tsx`.

---

## Tech Stack

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Framework        | Next.js 16 (App Router, RSC)                 |
| UI               | React 19, Tailwind CSS v4, Monaco Editor     |
| Database         | Supabase Postgres, Prisma 7                  |
| Auth             | Supabase OAuth (GitHub/Google) + guest UUIDs |
| AI               | OpenRouter + Vercel AI SDK (streaming)       |
| Python execution | Pyodide (WASM, in-browser)                   |
| Testing          | Vitest (unit), Playwright (E2E)              |
| CI/CD            | GitHub Actions (4 workflows)                 |
| Deployment       | Vercel                                       |
| Package manager  | Bun                                          |
| Versioning       | Changesets                                   |

---

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages + API routes)
├── components/
│   ├── ui/                 # Primitives (Button, Card, Badge, etc.)
│   └── domain/             # Feature components (CoachingPanel, CodeEditor, etc.)
├── hooks/                  # useUser, useSession, useCodeExecution, useAIChat
├── lib/
│   ├── ai/                 # OpenRouter client, model config, 5 prompt builders
│   ├── auth/               # Guest-to-user migration
│   ├── db/                 # Prisma singleton
│   ├── execution/          # Pyodide worker interface
│   ├── supabase/           # Auth clients
│   └── mastery.ts          # Spaced repetition state machine
├── types/                  # Domain types (mirror Prisma enums)
└── middleware.ts            # Supabase session refresh
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full system design, or the [docs/](docs/) directory for detailed references:

- [Architecture](docs/ARCHITECTURE.md) — data flows, diagrams, tech rationale
- [AI System](docs/AI-SYSTEM.md) — prompt contexts, model config, streaming
- [Database](docs/DATABASE.md) — schema, models, enums, migrations
- [Design System](docs/DESIGN-SYSTEM.md) — tokens, colors, typography, components
- [Security](docs/SECURITY.md) — known gaps, mitigations
- [Roadmap](docs/ROADMAP.md) — post-MVP features

---

## Scripts

```bash
bun dev              # Start dev server
bun run build        # Production build
bun run lint         # ESLint
bun run type-check   # TypeScript check
bun run format       # Prettier
bun run test         # Unit tests (Vitest)
bun run test:e2e     # E2E tests (Playwright)
bun run changeset    # Create a changeset for your PR
```

---

## Deployment

See [DEPLOY.md](DEPLOY.md) for the full checklist.

---

## Contributing

See [CONTRIBUTING.md](.github/CONTRIBUTING.md). Key requirements: feature branches, conventional commits, changeset per PR, tests for new logic.
