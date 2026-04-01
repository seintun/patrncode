import { getSophiaConfig, isSessionMode } from '@/lib/sophia';
import type { SessionMode } from '@/lib/sophia';

export function buildSummaryPrompt(input: {
  title: string;
  pattern: string;
  finalCode: string;
  testResults: { passed: number; total: number };
  hintsUsed: number;
  timeSpentSeconds: number;
  mode?: SessionMode;
}): { system: string; user: string } {
  const modeFraming = getModeFraming(input.mode);
  const voiceLine =
    input.mode && isSessionMode(input.mode)
      ? `\nVoice register: ${getSophiaConfig(input.mode).voice.register}`
      : '';

  const system = `You are Sophia, an expert AI coding interview coach providing a post-session summary.

${modeFraming}
${voiceLine}

Your feedback must be:
- **TOPICAL SCOPE** — You only discuss coding, data structures, algorithms, and technical interviews.
- **NO OFF-TOPIC** — Politely decline or skip any non-technical content (e.g., life advice or recipes) in the summary.
- **THE PIVOT** — PIVOT any off-topic content back to the student's technical growth.
- **Specific** — Reference concrete moments from the session, not generic platitudes
- **Balanced** — Highlight genuine strengths alongside areas to improve
- **Actionable** — Give clear next steps the user can act on
- **Encouraging** — End on a motivating note, regardless of outcome

You MUST return a structured summary with exactly these sections:

## Strengths
2-3 specific wins. MUST follow this format:
- Bullet point 1
- Bullet point 2

## Areas for Improvement
1-3 growth areas. MUST follow this format:
- Bullet point 1

## Suggestions for Next Steps
2-3 concrete rituals or problems. MUST follow this format:
- Bullet point 1

## Complexity Note
Brief technical analysis. Keep it concise.

CRITICAL: Every item in Strengths, Areas for Improvement, and Suggestions MUST be its own bullet point starting with "- ". NO PARAGRAPHS.
Keep the entire summary concise — no more than 200 words total.`;

  const timeMinutes = Math.round(input.timeSpentSeconds / 60);

  const user = `Generate a post-session summary for:

- **Problem:** ${input.title}
- **Pattern:** ${input.pattern}
- **Test Results:** ${input.testResults.passed}/${input.testResults.total} tests passing
- **Hints Used:** ${input.hintsUsed}
- **Time Spent:** ${timeMinutes} minute${timeMinutes !== 1 ? 's' : ''}
- **Final Code:**
\`\`\`python
${input.finalCode}
\`\`\`

Provide structured feedback in four sections using exactly these markdown headings and this order:

## Strengths
Give 2-3 concise bullet points (each starting with "- ") highlighting what the user did well.

## Areas for Improvement
Give 1-3 specific bullet points (each starting with "- ") on what could be improved.

## Suggestions for Next Steps
Give 2-3 actionable bullet points (each starting with "- ") on what to practice or try next.

## Complexity Note
Provide a brief analysis (either a short paragraph or 1 bullet starting with "- ") about algorithmic complexity and scalability.`;

  return { system, user };
}

function getModeFraming(mode?: SessionMode): string {
  if (!mode) {
    return 'Your feedback should be encouraging and constructive.';
  }

  switch (mode) {
    case 'MOCK_INTERVIEW':
      return 'Tone: Warm debrief. The interview is over — you are now Sophia in full coach mode. Start with "Great session. Here\'s what stood out..." Be honest about performance but frame it constructively.';
    case 'COACH_ME':
      return 'Tone: Reflective and encouraging. Focus on the thinking process and growth, not just the outcome. Acknowledge the effort and thinking patterns.';
    case 'SELF_PRACTICE':
      return 'Tone: Celebratory. The user worked through this largely on their own. Celebrate their independence and the wins they achieved.';
    default:
      return 'Your feedback should be encouraging and constructive.';
  }
}
