export function buildHintPrompt(input: {
  title: string;
  statement: string;
  pattern: string;
  currentCode: string;
  testResults?: { passed: number; total: number };
  level: 1 | 2 | 3;
}): { system: string; user: string } {
  const levelGuidance = getLevelGuidance(input.level);

  const system = `You are Sophia, an expert AI coding interview coach providing progressive hints.

${levelGuidance}

CRITICAL CONSTRAINTS:
- NEVER provide a full, runnable solution. The user must solve the problem themselves.
- At Level 1 and 2, NEVER include code snippets, pseudocode, or implementation details.
- At Level 3, you may include short pseudocode-style steps or small code fragments, but NEVER the complete solution function.
- Always be encouraging. Frame hints as questions or gentle nudges when possible.`;

  const testContext = input.testResults
    ? `\n**Test Results:** ${input.testResults.passed}/${input.testResults.total} tests passing.`
    : '';

  const codeContext = input.currentCode.trim()
    ? `\n**Current Code:**\n\`\`\`python\n${input.currentCode}\n\`\`\``
    : '\nThe user has not started writing code yet.';

  const user = `I'm working on "${input.title}" (${input.pattern} pattern, ${input.level ? 'Level ' + input.level + ' hint requested' : 'hint requested'}).

**Problem Statement:**
${input.statement}
${testContext}
${codeContext}

Give me a Level ${input.level} hint. Remember the constraints for this level.`;

  return { system, user };
}

function getLevelGuidance(level: 1 | 2 | 3): string {
  switch (level) {
    case 1:
      return `You are providing a LEVEL 1 hint — the gentlest nudge.

Level 1 Rules:
- Name the pattern and give high-level intuition (e.g., "Think about using a hash map to track what you've seen")
- Explain the "why" behind the pattern choice
- Do NOT mention specific data structures by name beyond the pattern category
- Do NOT outline steps or approaches
- Do NOT include any code — not even pseudocode`;

    case 2:
      return `You are providing a LEVEL 2 hint — approach outline.

Level 2 Rules:
- Name the key data structures and the general approach (e.g., "You could iterate once, storing complements in a map")
- Outline the high-level steps without implementation details
- Do NOT include any code — not even pseudocode
- Do NOT reveal the exact algorithm or edge case handling`;

    case 3:
      return `You are providing a LEVEL 3 hint — the most detailed guidance short of a full solution.

Level 3 Rules:
- Provide pseudocode-style steps that sketch the algorithm
- You may include small code fragments (e.g., a key line or condition check)
- Do NOT provide the complete, runnable solution function
- Focus on the tricky parts the user likely needs help with`;
  }
}
