# Roadmap

> **Current status:** Beta (`0.1.0-beta.x`). The MVP is functional with core features: guest mode, problem practice, AI coaching, Pyodide execution, and progress tracking.

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
- Import LeetCode problems into patrncode sessions.
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
- Weak spot identification and targeted recommendations.
- Streak tracking and motivation systems.

---

## Known Limitations (Beta)

| Limitation                          | Impact                | Planned Fix                                       |
| ----------------------------------- | --------------------- | ------------------------------------------------- |
| No API authentication enforcement   | Critical security gap | Pre-production (see [SECURITY.md](./SECURITY.md)) |
| No rate limiting on AI routes       | Cost exposure         | `@upstash/ratelimit`                              |
| Hidden tests bypassable client-side | Cheating possible     | Server-side execution                             |
| Pyodide ~20MB first load            | Slow cold start       | Service worker preloading                         |
| Single model for all AI contexts    | Quality variance      | Context-specific model selection                  |
| Python only                         | Limited audience      | Multi-language support                            |
