# SEO — Content Strategy

## Target Keywords

### Primary (high intent, relevant to product)

| Keyword                      | Monthly Volume (est.) | Difficulty | Intent               | Status           |
| ---------------------------- | --------------------- | ---------- | -------------------- | ---------------- |
| coding interview practice    | 8,000                 | High       | Informational / TOFU | Target           |
| coding interview patterns    | 3,500                 | Medium     | Informational        | Blog post exists |
| leetcode patterns            | 5,000                 | High       | Informational        | Blog post exists |
| algorithm interview prep     | 2,500                 | Medium     | Informational        | Target           |
| ai coding interview practice | 800                   | Low        | Navigational         | Home page        |

### Secondary (long-tail, lower competition)

| Keyword                           | Monthly Volume (est.) | Difficulty | Status                             |
| --------------------------------- | --------------------- | ---------- | ---------------------------------- |
| clarify plan code reflect         | 200                   | Low        | Blog post exists                   |
| how to practice coding interviews | 1,200                 | Medium     | Target (expand existing post)      |
| progressive hints coding          | 150                   | Low        | Blog post exists                   |
| sliding window pattern leetcode   | 2,000                 | Medium     | Target (pattern deep-dive post)    |
| two pointers pattern              | 1,500                 | Medium     | Target (pattern deep-dive post)    |
| dynamic programming patterns      | 3,000                 | High       | Target (long-form guide)           |
| spaced repetition programming     | 400                   | Low        | Target (angle: mastery over grind) |

---

## Published Content

### Blog

| Post                                                                    | Slug                        | Target Keywords                                                  | Published  |
| ----------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------- | ---------- |
| 14 Coding Interview Patterns You Need to Master                         | `14-coding-patterns`        | coding interview patterns, leetcode patterns, algorithm patterns | 2026-03-01 |
| Clarify, Plan, Code, Reflect: The Interview Process That Actually Works | `clarify-plan-code-reflect` | clarify plan code reflect, coding interview process              | 2026-03-10 |
| Why Progressive Hints Beat Solutions (And How to Use Them)              | `progressive-hints`         | progressive hints, productive struggle, spaced repetition coding | 2026-03-18 |

### Docs

| Page            | Slug              | Purpose                             |
| --------------- | ----------------- | ----------------------------------- |
| Getting Started | `getting-started` | Onboarding, pattern table reference |

---

## Content Roadmap

### Priority 1 — Pattern Deep Dives (highest search volume)

Each post targets a specific pattern keyword. Planned structure:

- What the pattern is and when to use it
- 3 worked examples with code
- Common variations and edge cases
- Link to sophocode problems in that pattern

| Post                                        | Target Keyword                  | Status      |
| ------------------------------------------- | ------------------------------- | ----------- |
| Sliding Window Pattern: Complete Guide      | sliding window pattern leetcode | Not started |
| Two Pointers Pattern: When and How          | two pointers interview          | Not started |
| Dynamic Programming Patterns: 5 Types       | dynamic programming patterns    | Not started |
| BFS vs DFS: When to Use Each                | bfs vs dfs interview            | Not started |
| Binary Search Pattern: Beyond Sorted Arrays | binary search variations        | Not started |

### Priority 2 — Process + Learning Content

| Post                                                 | Target Keyword                 | Status      |
| ---------------------------------------------------- | ------------------------------ | ----------- |
| How to Study for Coding Interviews (Without Burnout) | how to study coding interviews | Not started |
| Spaced Repetition for Algorithm Mastery              | spaced repetition programming  | Not started |
| The 45-Minute Interview Breakdown                    | coding interview tips          | Not started |

### Priority 3 — Comparison + Alternatives (high-intent MOFU)

These target users comparing tools:

| Post                                    | Target Keyword       | Status      |
| --------------------------------------- | -------------------- | ----------- |
| sophocode vs LeetCode: A Wiser Approach | leetcode alternative | Not started |
| Why Patterns Beat Problem Count         | leetcode grinding    | Not started |

---

## Internal Linking Rules

1. **Every blog post** should link to at least one relevant `/practice` problem or pattern page
2. **Pattern deep-dive posts** should link to each other (Sliding Window ↔ Two Pointers)
3. **The docs getting-started page** should link to the top 3 recommended first problems
4. **The blog index** feeds naturally from `/` — add a "Latest from the blog" section to the landing page when there are 5+ posts
5. Include links to recommendation and roadmap surfaces when relevant (`/dashboard`, `/roadmap`) to reflect the current adaptive practice loop

---

## Content Quality Checklist

Before publishing any blog post:

- [ ] Title contains primary keyword
- [ ] Description is 140–160 characters and includes primary keyword
- [ ] At least one H2 contains a secondary keyword naturally
- [ ] Post links to `/practice` or a specific problem at least once
- [ ] Frontmatter has `title`, `description`, `publishedAt`, and `tags`
- [ ] Word count ≥ 1,000 (thin content penalty risk below this)
- [ ] No duplicate `<h1>` — frontmatter title renders as the only H1

---

## GEO (AI Search) Notes

To appear in AI Overviews, Perplexity, and ChatGPT responses:

1. **Definitions first** — open each section with a clear, quotable definition. AI systems extract these for direct answers.
2. **Lists and tables** — structured content is easier for AI to cite than prose paragraphs.
3. **Author/publisher signals** — `Article` JSON-LD with `author` and `publisher` set to the Organization schema helps AI systems attribute the content.
4. **llms.txt** — `public/llms.txt` describes the site for AI crawlers that support the standard.
5. **Unique insight** — AI systems cite sources that say something others don't. Generic advice won't rank in AI or traditional search.
