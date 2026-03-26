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

**Singleton pattern** (`src/lib/db/index.ts`) prevents multiple Prisma client instances during dev hot reloads:

```ts
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

---

## 2. Schema

### 2.1 Models

#### Problem

| Field         | Type            | Notes                                    |
| ------------- | --------------- | ---------------------------------------- |
| `id`          | `String` (cuid) | Primary key                              |
| `title`       | `String`        |                                          |
| `slug`        | `String`        | Unique                                   |
| `difficulty`  | `Difficulty`    | Enum: EASY, MEDIUM, HARD                 |
| `pattern`     | `Pattern`       | Enum: 14 algorithm patterns              |
| `tags`        | `String[]`      |                                          |
| `constraints` | `String[]`      |                                          |
| `sourceType`  | `SourceType`    | Default: INTERNAL                        |
| `externalUrl` | `String?`       | For external problems (LeetCode links)   |
| `statement`   | `String`        | Problem description                      |
| `examples`    | `Json`          | Array of {input, output, explanation?}   |
| `starterCode` | `String`        | Default: ""                              |
| `approaches`  | `Json?`         | Array of {name, description, complexity} |
| `sortOrder`   | `Int`           | Default: 0                               |

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

---

### 2.2 Enums

| Enum             | Values                                                                                                                                                                                  |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Difficulty`     | EASY, MEDIUM, HARD                                                                                                                                                                      |
| `Pattern`        | ARRAYS_STRINGS, HASH_MAPS, TWO_POINTERS, SLIDING_WINDOW, BINARY_SEARCH, LINKED_LISTS, STACKS_QUEUES, TREES, GRAPHS, RECURSION_BACKTRACKING, DYNAMIC_PROGRAMMING, HEAPS, SORTING, GREEDY |
| `SourceType`     | INTERNAL, EXTERNAL                                                                                                                                                                      |
| `SessionMode`    | SELF_PRACTICE, COACH_ME, MOCK_INTERVIEW                                                                                                                                                 |
| `SessionStatus`  | IN_PROGRESS, COMPLETED, ABANDONED                                                                                                                                                       |
| `SessionOutcome` | SOLVED, PARTIALLY_SOLVED, NOT_SOLVED                                                                                                                                                    |
| `MasteryState`   | UNSEEN, IN_PROGRESS, MASTERED, NEEDS_REFRESH                                                                                                                                            |
| `MessageRole`    | USER, ASSISTANT, SYSTEM                                                                                                                                                                 |

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

## 5. Schema Sync

The project currently uses `db push` (no migration history). This is suitable for rapid development during beta.

```bash
# Sync schema to database (creates/alters tables to match schema.prisma)
bunx prisma db push

# Seed sample problems (8 problems with test cases)
bunx prisma db seed

# Generate Prisma client after schema changes
bunx prisma generate
```

> [!NOTE]
> When the project stabilizes post-beta, switch to `prisma migrate dev` for versioned, reviewable migrations. See the [Prisma docs on migrate vs db push](https://www.prisma.io/docs/orm/prisma-migrate/understanding-prisma-migrate/mental-model#choosing-db-push-or-prisma-migrate).
