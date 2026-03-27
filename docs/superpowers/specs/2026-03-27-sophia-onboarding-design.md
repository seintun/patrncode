# Sophia Onboarding Integration — Design Spec

**Date:** 2026-03-27
**Status:** Approved
**Feature:** Onboarding — Sophia persona presence and introduction

---

## Problem

The existing 5-step onboarding never introduces Sophia. Users arrive at a session and encounter an AI coach with no context — no face, no name, no explanation of what she does or how she works. This creates confusion and erodes trust before the first interaction.

---

## Solution

Introduce Sophia as a named, visible guide throughout onboarding using a dedicated intro step and per-step speech bubbles with a typewriter animation.

---

## Step Structure (6 steps total, up from 5)

| #   | Title                | Change          |
| --- | -------------------- | --------------- |
| 1   | Meet Sophia          | **NEW**         |
| 2   | Experience Level     | + Sophia bubble |
| 3   | What Interviews Test | + Sophia bubble |
| 4   | The Process          | + Sophia bubble |
| 5   | Big-O Made Simple    | + Sophia bubble |
| 6   | You're Ready         | + Sophia bubble |

---

## Step 1 — Meet Sophia (new)

**Layout:** Centered portrait, image constrained to ~260px wide, `rounded-xl`, teal ring border (`#2dd4bf`)

**Image:** `public/sophia/modes_sophia.avif` — served via native `<img>` (not `next/image`, avif bypasses sharp pipeline)

**Copy (Sophia's voice):**

> "Hey, I'm Sophia. Think of me as the senior engineer who sits next to you — I won't solve it for you, but I'll never let you stay stuck either."

**CTA:** "Let's go" button → advances to step 2

---

## Speech Bubble Component (Steps 2–6)

### Visual anatomy

```
[28px avatar.svg circle]  |  "Sophia's line types in here..."
                          ^
                    left-pointing CSS tail
                    left border: #2dd4bf (2px)
                    bg: #0d3d38
                    text: #99f6e4
```

### Positioning

- Rendered **above** the step heading on every step
- Sophia frames the concept before the user reads it

### Per-step copy

| Step                     | Sophia's line                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| 2 — Experience Level     | "First things first — where are you starting from? No wrong answer here."                                             |
| 3 — What Interviews Test | "Here's what most people get wrong: interviews aren't testing if you know the answer. They're testing how you think." |
| 4 — The Process          | "I'll be coaching you through this same four-step process every session. It works for any problem, any company."      |
| 5 — Big-O                | "One thing interviewers always ask about: how efficient is your solution? Here's what that means."                    |
| 6 — You're Ready         | "That's everything you need to get started. I'll be right there with you — let's go."                                 |

---

## Typewriter Animation

- Text characters render one-by-one on step load (~30ms per character)
- **Click-to-skip:** clicking anywhere on the bubble instantly reveals the full text
- **Always replays:** navigating to any step (forward or back) re-runs the animation
- **CTA button:** always enabled — never gated behind the animation completing

---

## Implementation Notes

- `TOTAL_STEPS` constant: update from `5` to `6`
- Step indicator dots: update to reflect 6 steps
- `modes_sophia.avif` is pre-optimized avif — use native `<img>`, not `next/image`
- Colors come from `SOPHIA_MODES.SELF_PRACTICE.colors` in `src/lib/sophia.ts` (teal palette)
- Avatar uses `SOPHIA_AVATAR` (`/sophia/avatar.svg`) with `onError` fallback (colored "S" circle)
- Speech bubble is a self-contained component: `<SophiaBubble text="" />`

---

## Out of Scope

- No persistent sidebar
- No full-width hero image
- No gating of CTA on animation completion
- No per-mode color switching (onboarding is mode-agnostic, uses teal throughout)
