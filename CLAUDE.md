@AGENTS.md

# sophocode Project Context

## Architecture

- Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Prisma 7 (Supabase Postgres)
- Guest-first anonymous sessions (localStorage guestId), auth added later
- Pyodide WASM for browser-side Python execution
- Vercel AI SDK streaming over OpenRouter for AI coaching
- Three-panel session: problem | editor | coaching chat

## Conventions

- Package manager: bun (NOT npm)
- Prisma schema: prisma/schema.prisma, client: src/generated/prisma/
- Prisma v7: URL configured in prisma.config.ts, NOT schema.prisma
- Design tokens: src/app/globals.css (60-30-10 dark system)
- Components: src/components/ui/ (primitives), src/components/domain/ (features)
- Tests: vitest for unit, playwright for e2e
- Commits: conventional commits (commitlint enforced)

## Known Gotchas

- Prisma v7: URL in prisma.config.ts, NOT schema.prisma. Client output to src/generated/prisma/
- Tailwind v4: @theme directive, not tailwind.config.ts
- Next.js 16: breaking changes from 15 — read node_modules/next/dist/docs/ before coding
- Monaco Editor: next/dynamic with ssr:false required
- Pyodide: ~20MB lazy load, 5s timeout per test case
- OPENROUTER_API_KEY NOT in .env.local yet — AI routes built structurally, won't stream until key added
- Obsidian CLI: /Applications/Obsidian.app/Contents/MacOS/obsidian vault="Obsidian Vault" (full path required)
- Obsidian vault dir: "AI Interview Playground (SophoCode)" — note the parenthetical suffix

## File Structure

```
src/
├── app/           # Next.js App Router pages + API routes
├── components/
│   ├── ui/        # Primitives: Button, Badge, Card, Input, Select, Skeleton
│   └── domain/    # Feature components: ProblemList, SessionLayout, etc.
├── hooks/         # React hooks
├── lib/
│   ├── ai/        # OpenRouter provider, models, prompts
│   ├── db/        # Prisma singleton
│   ├── execution/ # Pyodide worker + runner
│   ├── guest.ts   # Guest ID management
│   ├── mastery.ts # State machine + spaced repetition
│   └── utils.ts   # cn() helper
└── types/         # TypeScript types
```
