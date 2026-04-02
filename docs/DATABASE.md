# Database Reference

## Overview

sophocode uses **Supabase Postgres** as the database, accessed via **Prisma 7** with the `@prisma/adapter-pg` adapter for edge-compatible connection pooling.

---

## 1. Prisma v7 Configuration

Prisma v7 uses a `prisma.config.ts` file (not `schema.prisma`) for database URL and adapter configuration:

```ts
// prisma.config.ts
import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

config({ path: '.env.local' });
config({ path: '.env' });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'bun ./prisma/seed.ts',
  },
  datasource: {
    url: process.env['DIRECT_URL'] ?? process.env['DATABASE_URL']!,
  },
});
```

**Gotcha:** The DB URL lives in `prisma.config.ts`, not in the schema file. This is a common confusion point when migrating from Prisma v6. The schema file's `datasource` block only specifies `provider = "postgresql"` — no URL.

The generated client outputs to `src/generated/prisma/`.

**Connection pooling:** `@prisma/adapter-pg` with `@prisma/pg-worker` enables edge-compatible pooling for Vercel serverless/edge runtimes.

**Singleton pattern** (`src/lib/db/prisma.ts`) prevents multiple Prisma client instances during dev hot reloads:

```ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 2. Schema

### 2.1 Models

#### Problem

| Field                | Type            | Notes                                       |
| -------------------- | --------------- | ------------------------------------------- |
| `id`                 | `String` (cuid) | Primary key                                 |
| `title`              | `String`        |                                             |
| `slug`               | `String`        | Unique                                      |
| `difficulty`         | `Difficulty`    | Enum: EASY, MEDIUM, HARD                    |
| `pattern`            | `Pattern`       | Enum: platform pattern taxonomy (20 values) |
| `tags`               | `String[]`      |                                             |
| `constraints`        | `String[]`      |                                             |
| `sourceType`         | `SourceType`    | Default: INTERNAL                           |
| `externalUrl`        | `String?`       | For external problems (LeetCode links)      |
| `statement`          | `String`        | Problem description                         |
| `examples`           | `Json`          | Array of {input, output, explanation?}      |
| `starterCode`        | `String`        | Default: ""                                 |
| `approaches`         | `Json?`         | Array of {name, description, complexity}    |
| `sortOrder`          | `Int`           | Default: 0                                  |
| `isCurated`          | `Boolean`       | Default: false                              |
| `curatedOrder`       | `Int?`          | Optional curated display order              |
| `dailyChallengeDate` | `DateTime?`     | Daily challenge linkage                     |

**Relations:** testCases, sessions, problemStates

#### TestCase

| Field       | Type            | Notes          |
| ----------- | --------------- | -------------- |
| `id`        | `String` (cuid) | Primary key    |
| `problemId` | `String`        | FK → Problem   |
| `input`     | `String`        |                |
| `expected`  | `String`        |                |
| `isHidden`  | `Boolean`       | Default: false |
| `order`     | `Int`           |                |

Cascade delete on Problem.

#### Session

| Field         | Type              | Notes                                         |
| ------------- | ----------------- | --------------------------------------------- |
| `id`          | `String` (cuid)   | Primary key                                   |
| `guestId`     | `String`          | Indexed                                       |
| `userId`      | `String?`         | Indexed (set after auth migration)            |
| `problemId`   | `String`          | FK → Problem, indexed                         |
| `mode`        | `SessionMode`     | Enum: SELF_PRACTICE, COACH_ME, MOCK_INTERVIEW |
| `status`      | `SessionStatus`   | Default: IN_PROGRESS                          |
| `code`        | `String?`         | Last saved code snapshot                      |
| `startedAt`   | `DateTime`        | Default: now()                                |
| `completedAt` | `DateTime?`       |                                               |
| `outcome`     | `SessionOutcome?` | Enum: SOLVED, PARTIALLY_SOLVED, NOT_SOLVED    |

**Relations:** problem, runs, hints, feedback, messages

#### TestRun

| Field       | Type            | Notes                 |
| ----------- | --------------- | --------------------- |
| `id`        | `String` (cuid) | Primary key           |
| `sessionId` | `String`        | FK → Session          |
| `code`      | `String`        | Code at time of run   |
| `results`   | `Json`          | Array of test results |
| `passed`    | `Int`           |                       |
| `total`     | `Int`           |                       |

Cascade delete on Session.

#### Hint

| Field       | Type            | Notes        |
| ----------- | --------------- | ------------ |
| `id`        | `String` (cuid) | Primary key  |
| `sessionId` | `String`        | FK → Session |
| `level`     | `Int`           | 1, 2, or 3   |
| `content`   | `String`        | Hint text    |

Cascade delete on Session.

#### SessionFeedback

| Field            | Type            | Notes               |
| ---------------- | --------------- | ------------------- |
| `id`             | `String` (cuid) | Primary key         |
| `sessionId`      | `String`        | Unique FK → Session |
| `strengths`      | `String`        |                     |
| `weaknesses`     | `String`        |                     |
| `suggestions`    | `String`        |                     |
| `complexityNote` | `String`        |                     |

Cascade delete on Session.

#### SessionMessage

| Field       | Type            | Notes                         |
| ----------- | --------------- | ----------------------------- |
| `id`        | `String` (cuid) | Primary key                   |
| `sessionId` | `String`        | FK → Session                  |
| `role`      | `MessageRole`   | Enum: USER, ASSISTANT, SYSTEM |
| `content`   | `String`        |                               |
| `metadata`  | `Json?`         |                               |

Cascade delete on Session.

#### UserProblemState

| Field             | Type            | Notes                 |
| ----------------- | --------------- | --------------------- |
| `id`              | `String` (cuid) | Primary key           |
| `guestId`         | `String`        | Indexed               |
| `userId`          | `String?`       | Indexed               |
| `problemId`       | `String`        | FK → Problem, indexed |
| `mastery`         | `MasteryState`  | Default: UNSEEN       |
| `lastAttemptedAt` | `DateTime?`     |                       |
| `nextReviewAt`    | `DateTime?`     |                       |
| `attemptCount`    | `Int`           | Default: 0            |
| `solveCount`      | `Int`           | Default: 0            |

**Unique constraint:** `@@unique([guestId, problemId])`

Cascade delete on Problem.

#### PatternWeakness (Wave 3)

| Field             | Type            | Notes                                   |
| ----------------- | --------------- | --------------------------------------- |
| `id`              | `String` (cuid) | Primary key                             |
| `guestId`         | `String`        | Indexed                                 |
| `pattern`         | `Pattern`       | Indexed with `guestId` (unique pair)    |
| `failedCount`     | `Int`           | Default: 0                              |
| `successCount`    | `Int`           | Default: 0                              |
| `lastPracticedAt` | `DateTime?`     | Last update timestamp from session flow |
| `confidenceScore` | `Float`         | Default: 0.5                            |

**Unique constraint:** `@@unique([guestId, pattern])`

Used by adaptive recommendation logic to rank weak patterns.

#### CustomProblemRequest (Wave 3)

| Field          | Type            | Notes                                                  |
| -------------- | --------------- | ------------------------------------------------------ |
| `id`           | `String` (cuid) | Primary key                                            |
| `guestId`      | `String`        | Indexed with `createdAt`                               |
| `pattern`      | `Pattern`       | Requested pattern                                      |
| `difficulty`   | `Difficulty?`   | Optional requested difficulty                          |
| `status`       | `RequestStatus` | `PENDING`, `FULFILLED`, `FAILED`                       |
| `title`        | `String?`       | Generated title snapshot                               |
| `statement`    | `String?`       | Generated statement snapshot                           |
| `starterCode`  | `String?`       | Generated starter code snapshot                        |
| `testCases`    | `Json?`         | Generated test cases snapshot                          |
| `errorMessage` | `String?`       | Persisted failure reason when generation/parsing fails |

Tracks AI generation lifecycle for observability and debugging.

---

### 2.2 Enums

| Enum             | Values                                                                                                                                                                                                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Difficulty`     | EASY, MEDIUM, HARD                                                                                                                                                                                                                                                      |
| `Pattern`        | ARRAYS_STRINGS, HASH_MAPS, TWO_POINTERS, SLIDING_WINDOW, BINARY_SEARCH, LINKED_LISTS, STACKS_QUEUES, TREES, GRAPHS, RECURSION_BACKTRACKING, DYNAMIC_PROGRAMMING, HEAPS, SORTING, GREEDY, TRIES, BIT_MANIPULATION, INTERVALS, ADVANCED_GRAPHS, MATH_GEOMETRY, PREFIX_SUM |
| `SourceType`     | INTERNAL, EXTERNAL                                                                                                                                                                                                                                                      |
| `SessionMode`    | SELF_PRACTICE, COACH_ME, MOCK_INTERVIEW                                                                                                                                                                                                                                 |
| `SessionStatus`  | IN_PROGRESS, COMPLETED, ABANDONED                                                                                                                                                                                                                                       |
| `SessionOutcome` | SOLVED, PARTIALLY_SOLVED, NOT_SOLVED                                                                                                                                                                                                                                    |
| `MasteryState`   | UNSEEN, IN_PROGRESS, MASTERED, NEEDS_REFRESH                                                                                                                                                                                                                            |
| `MessageRole`    | USER, ASSISTANT, SYSTEM                                                                                                                                                                                                                                                 |
| `RequestStatus`  | PENDING, FULFILLED, FAILED                                                                                                                                                                                                                                              |

`Pattern` currently includes 20 values: ARRAYS_STRINGS, HASH_MAPS, TWO_POINTERS, SLIDING_WINDOW, BINARY_SEARCH, LINKED_LISTS, STACKS_QUEUES, TREES, GRAPHS, RECURSION_BACKTRACKING, DYNAMIC_PROGRAMMING, HEAPS, SORTING, GREEDY, TRIES, BIT_MANIPULATION, INTERVALS, ADVANCED_GRAPHS, MATH_GEOMETRY, PREFIX_SUM.

---

## 3. Mastery State Machine

Defined in `src/lib/mastery.ts`. See [ARCHITECTURE.md §4.4](./ARCHITECTURE.md#44-spaced-repetition-mastery-system) for the full state diagram and transition rules.

**Review intervals:**

| State         | Next review (days) |
| ------------- | ------------------ |
| MASTERED      | 7                  |
| NEEDS_REFRESH | 3                  |
| IN_PROGRESS   | 1                  |
| UNSEEN        | 1                  |

---

## 4. Seed Data

Seeded via `bun prisma/seed.ts` (configured in `package.json` under `prisma.seed`).

Run manually: `bunx prisma db seed`

---

## 5.1 Wave 3 Trigram Index Safety

Wave 3 uses trigram indexes on `Problem.title` and `Problem.statement` for search and recommendation quality.

Those indexes are created in a dedicated migration file using migration-safe SQL (`CREATE INDEX IF NOT EXISTS`):

- `prisma/migrations/202604011700_wave3_trgm_indexes_concurrently/migration.sql`

Rollback command:

```bash
psql "$DATABASE_URL" -f scripts/rollback-wave3-trgm-indexes.sql
```

Verification query:

```sql
SELECT indexname
FROM pg_indexes
WHERE tablename = 'Problem'
  AND indexname IN ('problem_title_trgm', 'problem_statement_trgm');
```

---

## 5. Schema Sync and Migrations

The project now includes versioned migrations under `prisma/migrations/` and should prefer migrate workflows over repeated `db push`.

```bash
# Development: create/apply migration from schema changes
bunx prisma migrate dev

# Production/staging: apply committed migrations
bunx prisma migrate deploy

# Verify extension/index rollout after deploy
bunx prisma db execute --stdin <<'SQL'
SELECT extname FROM pg_extension WHERE extname = 'pg_trgm';
SELECT indexname
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN (
    'problem_title_trgm',
    'problem_statement_trgm',
    'Session_guestId_problemId_startedAt_idx',
    'TestCase_problemId_isHidden_order_idx',
    'ProblemHint_problemId_source_idx'
  )
ORDER BY indexname;
SQL

# Generate Prisma client after schema changes
bunx prisma generate

# Seed sample problems
bunx prisma db seed
```

If you're adopting Prisma Migrate on an existing non-empty database, baseline first:

```bash
# One-time baseline for an already-applied migration
bunx prisma migrate resolve --applied <migration_name>
```

Use `bunx prisma db push` only as an emergency sync path in non-production contexts.

### 5.1 Search setup note (`pg_trgm`)

`GET /api/problems?search=...` now relies on case-insensitive substring ranking and ships with trigram indexes for scale. The migration `202604012240_perf_indexes_and_search` enables `pg_trgm` and creates search/perf indexes.

If your database role cannot create extensions, have a DBA run:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

before running `bunx prisma migrate deploy`.
