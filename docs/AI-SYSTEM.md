# AI System

## Overview

sophocode's AI coaching is powered by **OpenRouter** (model-agnostic gateway) with the **Vercel AI SDK** for streaming. Five specialized prompt contexts enforce strict no-spoiler rules — the AI teaches patterns and thinking, never solutions.

Wave 3 adds two important guardrails around this core system:

- **Mode-aware control** (`sessionMode`) is passed into chat/coaching contexts so behavior stays aligned with `SELF_PRACTICE`, `COACH_ME`, and `MOCK_INTERVIEW` expectations.
- **Defense-in-depth safety** applies both prompt constraints and render-time sanitization (`sanitizeCoachingContent`) so accidental code/pseudocode leakage is filtered before display.

---

## 1. Architecture

```
Browser (useAIChat) → POST /api/ai/[context] → streamText() → OpenRouter → LLM → SSE stream → Browser
```

**Key files:**

| File                                | Role                                |
| ----------------------------------- | ----------------------------------- |
| `src/lib/ai/provider.ts`            | OpenRouter client config            |
| `src/lib/ai/models.ts`              | Model ID constants                  |
| `src/lib/ai/prompts/explanation.ts` | Explanation prompt builder          |
| `src/lib/ai/prompts/hint.ts`        | 3-level hint prompt builder         |
| `src/lib/ai/prompts/coach.ts`       | Socratic coach prompt builder       |
| `src/lib/ai/prompts/interviewer.ts` | Mock interviewer prompt builder     |
| `src/lib/ai/prompts/summary.ts`     | Post-session summary prompt builder |
| `src/app/api/ai/`                   | Streaming API route handlers        |

---

## 2. Model Configuration

The OpenRouter client uses the OpenAI-compatible API:

```ts
// src/lib/ai/provider.ts
import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
});
```

Model IDs are centralized in `src/lib/ai/models.ts`:

```ts
export const MODELS = {
  reasoning: 'stepfun/step-3.5-flash:free',
  summary: 'stepfun/step-3.5-flash:free',
} as const;
```

Both reasoning and summary currently use the same free model. Swapping models requires changing a single constant — no prompt or streaming logic changes needed.

---

## 3. Streaming

API routes use `streamText` from the Vercel AI SDK:

```ts
import { streamText } from 'ai';
import { openrouter } from '@/lib/ai/provider';

export async function POST(req: Request) {
  const { problem, code, level } = await req.json();
  const result = streamText({
    model: openrouter(MODELS.reasoning),
    messages: buildHintPrompt({ problem, code, level }),
  });
  return result.toDataStreamResponse();
}
```

The client uses `useAIChat` (wrapping the SDK's `useChat`) to incrementally render tokens as they stream in.

---

## 4. Prompt Contexts

All prompts share a common constraint: **"Do not provide a complete solution or code that directly solves the problem."**

### 4.1 Explanation (`explanation.ts`)

**When:** User requests a concept explanation for a problem.

**Behavior:**

- Restates the problem in plain language.
- Names the pattern and explains the high-level strategy.
- Explains Big-O using analogies, not raw notation (e.g., "O(n) is like reading every page of a book once").
- Never provides full solution code.

**Input:** title, statement, pattern, difficulty.

### 4.2 Hint (`hint.ts`)

**When:** User requests a hint during a session.

**Behavior:** 3-level progressive hints:

| Level         | What it provides                      | Code allowed?                                 |
| ------------- | ------------------------------------- | --------------------------------------------- |
| 1 — Direction | Pattern name, high-level intuition    | No code at all                                |
| 2 — Approach  | Data structures, general steps        | No code at all                                |
| 3 — Specific  | Pseudocode-style steps, key fragments | Small fragments only, never complete solution |

**Input:** title, statement, pattern, currentCode, testResults, level (1-3).

**Context awareness:** Includes the user's current code and test results so hints can target specific failing cases.

### 4.3 Coach (`coach.ts`)

**When:** User is in "Coach Me" mode.

**Behavior:**

- Warm, supportive personality. Celebrates small wins.
- Asks guiding questions instead of giving direct answers.
- Explains Big-O with analogies.
- Reminds users of the Clarify → Plan → Code → Reflect process.

**Input:** title, statement, pattern, difficulty.

### 4.4 Interviewer (`interviewer.ts`)

**When:** User is in "Mock Interview" mode.

**Behavior:**

- Simulates a senior engineer at a top-tier company.
- Uses Socratic questioning — guides through questions, not answers.
- Probes edge cases, time complexity, communication.
- Evaluates: problem understanding, approach selection, communication, implementation, testing mindset.

**Input:** title, statement, pattern, difficulty.

### 4.5 Summary (`summary.ts`)

**When:** Session is completed.

**Behavior:** Returns a structured summary with exactly four sections:

1. **Strengths** — 2-3 specific things done well.
2. **Areas for Improvement** — 1-3 honest but constructive items.
3. **Suggestions for Next Steps** — 2-3 actionable recommendations.
4. **Complexity Note** — Time/space analysis using intuitive language.

**Input:** title, pattern, finalCode, testResults, hintsUsed, timeSpentSeconds.

**Constraint:** Entire summary ≤ 250 words.

---

## 5. Graceful Degradation

- If `OPENROUTER_API_KEY` is not set, AI routes return `503 Service Unavailable`.
- Core coding and execution features work independently of AI availability (Pyodide runs locally).
- The UI shows a banner (`AIBanner` component) when AI is unavailable.

---

## 6. Wave 3 Tutor Additions

### 6.1 Custom Problem Generation (`POST /api/ai/generate-problem`)

Wave 3 introduces an AI generation endpoint that creates targeted practice problems by `pattern` and optional `difficulty`.

**Flow:**

1. Validate request payload with zod.
2. Enforce token budget (`checkTokenBudget`).
3. Persist `CustomProblemRequest` as `PENDING`.
4. Generate structured JSON via reasoning model.
5. Parse and validate response with zod.
6. Transactionally persist `Problem` + `TestCase[]`.
7. Mark request `FULFILLED` (or `FAILED` with error details on failure).

**Why this design:** request lifecycle persistence makes generation observable and recoverable, and strict schema validation reduces malformed AI output risks.

### 6.2 Session Reports (`GET/PATCH /api/sessions/[id]/report`)

Session report retrieval/update is now an explicit API capability:

- `GET` returns existing feedback or generates/stores summary feedback when missing.
- `PATCH` upserts user-editable report fields.

This keeps report generation deterministic at the API layer and avoids coupling report state to a single UI surface.
