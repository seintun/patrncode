---
title: 'Clarify, Plan, Code, Reflect: The Interview Process That Actually Works'
description: "Most candidates jump straight to coding. The best candidates don't. Here's the four-step process top engineers use to ace coding interviews consistently."
publishedAt: '2026-03-10'
tags: ['interview process', 'coding interviews', 'methodology', 'tips']
author: 'patrncode'
---

The most common mistake in coding interviews isn't getting the algorithm wrong.

It's jumping straight to code.

Interviewers aren't just evaluating whether you know the right algorithm. They're evaluating _how you think_. A candidate who codes fast but silently, makes wrong assumptions, and produces buggy output is far less impressive than one who asks one clarifying question, sketches a clean approach, codes it confidently, and then articulates trade-offs.

The Clarify → Plan → Code → Reflect loop is how the best candidates structure every single problem. Here's what each phase actually means.

## Clarify

Before you write a single line of code, ask questions.

Not because you're stalling — but because real software problems are always underspecified. The interviewer knows this. They _want_ to see you identify ambiguity.

Good clarifying questions:

- "What's the expected input range? Can n be zero?"
- "Should I handle duplicates? What should happen if the input is empty?"
- "Are we optimizing for time, space, or both?"
- "Is the array sorted? Can values be negative?"

What you're doing here isn't just getting information — you're demonstrating _product thinking_. You're showing that you don't build solutions to the wrong problem.

Aim for 2-3 targeted questions. Don't interrogate the interviewer; ask what would genuinely change your approach.

## Plan

Once you understand the problem, resist the urge to code. Instead, talk through your approach out loud.

This is where pattern recognition pays off. If you've internalized the 14 core patterns, you'll recognize the shape of the problem quickly:

- "This looks like a sliding window problem — I'm looking for the longest subarray satisfying a condition."
- "We have a sorted input and we're looking for a pair — two pointers makes sense."
- "We need K largest elements — a min-heap of size K gets us O(n log k)."

Verbalize your reasoning:

1. State the brute force approach first ("I could check every pair in O(n²)...")
2. Then explain how you'd optimize it ("...but if I use a hashmap, I can get this down to O(n)...")
3. Call out the time and space complexity before you start coding

Interviewers often stop candidates here and say "yes, that approach works, go ahead." You've already won the conceptual battle. The code is just implementation.

## Code

Now you write. A few principles:

**Write clean, readable code** — not clever code. Use meaningful variable names. Break logic into helper functions if it's getting long. Interviewers are reading your code in real time.

**Talk while you code** — narrate what you're doing. "I'm initializing a hashmap to track complement values..." This gives the interviewer a chance to catch misunderstandings early, before you've gone down the wrong path for 10 minutes.

**Handle edge cases explicitly** — don't hide them in your head. Write a comment like `// edge case: empty array` before handling it.

**Don't panic at bugs** — everyone writes bugs in interviews. The difference is whether you can find and fix them calmly. A candidate who says "let me trace through this with a small example" is showing exactly the debugging skill employers want.

## Reflect

You've written your solution. Most candidates stop here. The best candidates don't.

Reflection is where you demonstrate senior-level thinking:

- **Trace through an example**: Walk through your solution with the sample input. Verify it produces the expected output. Find any off-by-one errors.
- **Analyze complexity**: Confirm the time and space complexity. Is there a way to improve it?
- **Consider edge cases**: What happens with empty input? With duplicates? With the minimum/maximum possible values?
- **Discuss trade-offs**: "This solution is O(n log n) due to sorting. If the input were already sorted, we could skip that and get O(n)."

This phase signals that you don't just write code — you think about whether it's _good_ code.

---

## Putting It All Together

The loop takes about 2-3 minutes for Clarify, 3-5 minutes for Plan, 10-15 minutes for Code, and 3-5 minutes for Reflect. That's a comfortable fit for a 45-minute interview.

The key insight: **the interviewer is watching all four phases, but most candidates only practice one**. If you only practice coding, you're leaving three-quarters of your evaluation on the table.

Every session on patrncode follows this structure. The AI coach doesn't just check if your code passes tests — it guides you through each phase, asks clarifying questions if you skip ahead, and reflects back what your approach reveals about your thinking.

The goal isn't to produce the right answer. It's to become the kind of engineer who consistently produces right answers under pressure.
