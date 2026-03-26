# Contributing to patrncode

> **Active Beta** — The project is at `0.1.0-beta.x`. APIs and data models may change between commits.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development](#local-development)
- [Branch Strategy](#branch-strategy)
- [Commit Convention](#commit-convention)
- [Changeset Requirement](#changeset-requirement)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Code Style](#code-style)
- [Architecture Overview](#architecture-overview)

---

## Prerequisites

| Tool    | Version                 | Install                                     |
| ------- | ----------------------- | ------------------------------------------- |
| Bun     | ≥ 1.1.0                 | `curl -fsSL https://bun.sh/install \| bash` |
| Node.js | ≥ 20 (for tooling only) | [nodejs.org](https://nodejs.org)            |
| Git     | any                     | system                                      |

---

## Local Development

```bash
# 1. Clone and install
git clone https://github.com/your-org/patrncode.git
cd patrncode
bun install

# 2. Set up environment variables
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY,
# DATABASE_URL, DIRECT_URL, OPENROUTER_API_KEY

# 3. Run database migrations
bunx prisma migrate dev

# 4. Start dev server
bun dev
```

---

## Branch Strategy

All changes must live on a **feature branch** and be merged into `main` via a Pull Request. Direct pushes to `main` are blocked.

| Branch pattern                 | Purpose                                    |
| ------------------------------ | ------------------------------------------ |
| `feat/<short-description>`     | New features                               |
| `fix/<short-description>`      | Bug fixes                                  |
| `chore/<short-description>`    | Tooling, deps, config                      |
| `docs/<short-description>`     | Documentation only                         |
| `refactor/<short-description>` | Code restructuring without behavior change |
| `test/<short-description>`     | Adding or improving tests                  |

```bash
# Always branch from main
git checkout main && git pull
git checkout -b feat/my-feature
```

---

## Commit Convention

This project uses **Conventional Commits** enforced by `commitlint`. Every commit message must follow:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `perf`, `ci`, `build`, `revert`

**Examples:**

```bash
git commit -m "feat(session): add auto-save on tab switch"
git commit -m "fix(mastery): correct NEEDS_REFRESH interval calculation"
git commit -m "chore(deps): upgrade vitest to 4.2.0"
git commit -m "docs: update architecture diagram"
```

Commits that do not follow this format will be **rejected** by the pre-commit hook.

---

## Changeset Requirement

Every PR that introduces a user-facing or API change **must include a changeset file**. This drives automated CHANGELOG generation and semantic versioning.

```bash
# After your changes, run:
bun run changeset

# You will be prompted to:
# 1. Select the change type: patch | minor | major
# 2. Write a short summary of what changed

# Commit the generated .changeset/<random-name>.md file with your branch
```

**Skipping changesets:** If your PR is docs-only, CI config, or a pure chore with no user impact, add the `skip-changeset` label to the PR and explain the reason in the PR template.

| Change type | When to use                                       |
| ----------- | ------------------------------------------------- |
| `patch`     | Bug fixes, small improvements, dependency updates |
| `minor`     | New features, non-breaking API additions          |
| `major`     | Breaking changes (rare during beta)               |

---

## Pull Request Process

1. **Create a feature branch** (see [Branch Strategy](#branch-strategy))
2. **Make your changes** with conventional commits
3. **Add a changeset** with `bun run changeset` (or apply `skip-changeset` label)
4. **Ensure CI passes** locally before pushing:
   ```bash
   bun run lint
   bun run type-check
   bun run format:check
   bun run test
   ```
5. **Push and open a PR** — the PR template will guide you through the required sections
6. **Request a review** — PRs require at least one approving review
7. **Squash and merge** — keep `main` history clean

---

## Testing Requirements

| Type        | Runner               | When required                                                |
| ----------- | -------------------- | ------------------------------------------------------------ |
| Unit        | Vitest               | For all new logic in `src/lib/`, `src/hooks/`, UI components |
| Integration | Vitest + mock Prisma | For all new API routes                                       |
| E2E         | Playwright           | For critical user flows (auth, session, progress)            |

```bash
bun run test              # unit tests (also runs in pre-commit)
bun run test:coverage     # coverage report
bun run test:e2e          # playwright (requires running dev server or CI)
```

**Coverage expectations (beta phase):**

- New `src/lib/` modules: ≥ 80% line coverage
- New API routes: happy path + at least one error path
- New components: render test + primary interaction

---

## Code Style

Enforced automatically by ESLint + Prettier on every commit via `lint-staged`.

```bash
bun run lint          # ESLint (auto-fixes on pre-commit)
bun run format        # Prettier write
bun run format:check  # Prettier check (used in CI)
```

**Key conventions:**

- `import type` for type-only imports (ESLint enforced)
- Single quotes, semi-colons, `trailingComma: all`, `printWidth: 100`
- `@/` alias for all imports from `src/`
- Components in `src/components/ui/` are primitives only — no data fetching
- Components in `src/components/domain/` are feature components that may fetch

---

## Architecture Overview

See [`ARCHITECTURE.md`](../ARCHITECTURE.md) for a concise system overview, or the [`docs/`](../docs/) directory for detailed references:

| Document                                          | Contents                                         |
| ------------------------------------------------- | ------------------------------------------------ |
| [docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)   | Full system design, data flows, Mermaid diagrams |
| [docs/AI-SYSTEM.md](../docs/AI-SYSTEM.md)         | Prompt contexts, model config, streaming         |
| [docs/DATABASE.md](../docs/DATABASE.md)           | Prisma schema, models, enums, migrations         |
| [docs/DESIGN-SYSTEM.md](../docs/DESIGN-SYSTEM.md) | Design tokens, color palette, components         |
| [docs/SECURITY.md](../docs/SECURITY.md)           | Security gaps and mitigations                    |
| [docs/ROADMAP.md](../docs/ROADMAP.md)             | Post-MVP features and known limitations          |

Agent conventions are documented in [`AGENTS.md`](../AGENTS.md) and [`CLAUDE.md`](../CLAUDE.md) at the project root.
