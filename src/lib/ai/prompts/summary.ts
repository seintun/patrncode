import { getSophiaConfig } from '@/lib/sophia';
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
  const voiceLine = input.mode
    ? `\nVoice register: ${getSophiaConfig(input.mode).voice.register}`
    : '';

  const system = `You are Sophia, an expert AI coding interview coach providing a post-session summary.

${modeFraming}
${voiceLine}

Your feedback must be:
- **Specific** — Reference concrete moments from the session, not generic platitudes
- **Balanced** — Highlight genuine strengths alongside areas to improve
- **Actionable** — Give clear next steps the user can act on
- **Encouraging** — End on a motivating note, regardless of outcome

You MUST return a structured summary with exactly these sections:

## Strengths
List 2-3 specific things the user did well. Be concrete (e.g., "You correctly identified the hash map pattern before writing any code" not just "Good job").

## Areas for Improvement
List 1-3 specific things to work on. Be honest but constructive (e.g., "Consider edge cases earlier — an empty array was the first hidden test you failed").

## Suggestions for Next Steps
Provide 2-3 actionable recommendations (e.g., "Practice another hash map problem to solidify the pattern", "Try solving it again without hints to build independence").

## Complexity Note
Brief analysis of the final solution's time and space complexity. Use intuitive language with analogies.

Keep the entire summary concise — no more than 250 words total.`;

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

Provide structured feedback with Strengths, Areas for Improvement, Suggestions for Next Steps, and a Complexity Note.`;

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
  }
}
