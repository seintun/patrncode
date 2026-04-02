# Roadmap

> **Current status:** `0.2.x` beta. Core loop and adaptive tutoring foundations are live, including pattern weakness tracking, recommendations, custom problem generation, and reports.

## Recently Shipped (Wave 3)

- Pattern weakness tracking (`PatternWeakness`) to capture confidence by algorithm pattern.
- Cached next-problem recommendation API with weak-pattern-first ranking and roadmap fallback.
- AI custom problem generation endpoint with request lifecycle persistence (`CustomProblemRequest`).
- Session report API (`GET/PATCH`) and dashboard/roadmap recommendation surfaces.
- Mode-aware coaching safety hardening (prompt constraints + render-time sanitization).

---

## Post-MVP Features

### High Priority

#### Real-Time Voice Intelligence

- Voice-first interview mode using low-latency speech-to-text/speech APIs.
- Simulates the pressure of a verbal interview.
- Mic input for spoken clarifying questions and explanations.

#### Interviewer Persona Selection

- Toggle between "Friendly Mentor" and "Strict FAANG Interviewer" personas.
- Adjustable coaching intensity and feedback style.
- Different Socratic questioning depths per persona.

#### Additional Language Support

- Java, C++, JavaScript execution via Pyodide or server-side sandbox.
- Language-specific starter code and test harnesses.
- Multi-language problem statements.

### Medium Priority

#### Browser Extension

- Overlay hints and coaching directly on LeetCode problem pages.
- Import LeetCode problems into sophocode sessions.
- Sync progress between extension and main app.

#### Richer Big-O Visualizations

- Interactive charts showing algorithmic growth (linear vs quadratic vs logarithmic).
- Real-world analogies paired with visual representations.
- Side-by-side complexity comparisons for different approaches.

#### Server-Side Code Execution

- Move from client-side Pyodide to server-side sandbox (Firecracker MicroVMs or similar).
- Prevents hidden test case bypass.
- Enables stricter time/memory limits and multi-language support.

### Lower Priority

#### Deeper Curriculum Integrations

- Interview Cake topic mappings.
- Structured learning paths (Foundations → Core → Advanced).
- Prerequisite tracking ("master Two Pointers before Sliding Window").

#### Collaborative Features

- Pair programming sessions.
- Shared problem solving with friends/study groups.

#### Analytics & Insights

- Time-per-pattern analytics.
- Weak spot identification and targeted recommendations. (Shipped in Wave 3)
- Streak tracking and motivation systems.

---

## Known Limitations (Beta)

| Limitation                          | Impact            | Planned Fix                          |
| ----------------------------------- | ----------------- | ------------------------------------ |
| AI quota governance not complete    | Cost exposure     | Per-user/day quota ledger + alerts   |
| Distributed RL fallback is per-node | Burst abuse risk  | Redis-backed global enforcement only |
| Hidden tests bypassable client-side | Cheating possible | Server-side execution                |
| Pyodide ~20MB first load            | Slow cold start   | Service worker preloading            |
| Single model for all AI contexts    | Quality variance  | Context-specific model selection     |
| Python only                         | Limited audience  | Multi-language support               |
