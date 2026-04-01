import { describe, it, expect } from 'vitest';
import { buildExplanationPrompt } from '../explanation';
import { buildHintPrompt } from '../hint';
import { buildCoachPrompt } from '../coach';
import { buildInterviewerPrompt } from '../interviewer';
import { buildSummaryPrompt } from '../summary';

const problemContext = {
  title: 'Two Sum',
  statement:
    'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
  pattern: 'HASH_MAPS',
  difficulty: 'EASY',
};

describe('buildExplanationPrompt', () => {
  it('returns system and user strings', () => {
    const result = buildExplanationPrompt(problemContext);
    expect(result).toHaveProperty('system');
    expect(result).toHaveProperty('user');
    expect(typeof result.system).toBe('string');
    expect(typeof result.user).toBe('string');
  });

  it('explicitly forbids providing full solution code', () => {
    const result = buildExplanationPrompt(problemContext);
    expect(result.system.toLowerCase()).toContain('never provide full solution code');
    expect(result.system.toLowerCase()).toContain('never');
  });

  it('includes problem details in user message', () => {
    const result = buildExplanationPrompt(problemContext);
    expect(result.user).toContain('Two Sum');
    expect(result.user).toContain('HASH_MAPS');
    expect(result.user).toContain('EASY');
  });

  it('mentions plain-language restatement and complexity', () => {
    const result = buildExplanationPrompt(problemContext);
    expect(result.system.toLowerCase()).toContain('plain-language restatement');
    expect(result.system.toLowerCase()).toContain('complexity');
  });

  it('uses encouraging tone', () => {
    const result = buildExplanationPrompt(problemContext);
    expect(result.system.toLowerCase()).toMatch(/encouraging|mentor|patience/);
  });
});

describe('buildHintPrompt', () => {
  it('returns system and user strings', () => {
    const result = buildHintPrompt({ ...problemContext, currentCode: '', level: 1 });
    expect(result).toHaveProperty('system');
    expect(result).toHaveProperty('user');
  });

  describe('Level 1', () => {
    it('never contains code snippets', () => {
      const result = buildHintPrompt({
        ...problemContext,
        currentCode: 'def two_sum(): pass',
        level: 1,
      });
      expect(result.system.toLowerCase()).toContain('do not include any code');
      expect(result.user).toContain('Level 1');
    });

    it('asks for pattern name and intuition only', () => {
      const result = buildHintPrompt({ ...problemContext, currentCode: '', level: 1 });
      expect(result.system.toLowerCase()).toMatch(/pattern|intuition|high-level/);
    });
  });

  describe('Level 2', () => {
    it('never contains code snippets', () => {
      const result = buildHintPrompt({
        ...problemContext,
        currentCode: 'def two_sum(): pass',
        level: 2,
      });
      expect(result.system.toLowerCase()).toContain('do not include any code');
    });

    it('allows approach outline and data structures', () => {
      const result = buildHintPrompt({ ...problemContext, currentCode: '', level: 2 });
      expect(result.system.toLowerCase()).toMatch(/approach|data structures/);
    });
  });

  describe('Level 3', () => {
    it('forbids pseudocode and full solutions', () => {
      const result = buildHintPrompt({
        ...problemContext,
        currentCode: 'def two_sum(): pass',
        level: 3,
      });
      expect(result.system.toLowerCase()).toContain('do not include pseudocode');
      expect(result.system.toLowerCase()).toContain('do not provide the complete');
    });
  });

  it('includes test results when provided', () => {
    const result = buildHintPrompt({
      ...problemContext,
      currentCode: 'def two_sum(): return [0, 1]',
      testResults: { passed: 2, total: 5 },
      level: 1,
    });
    expect(result.user).toContain('2/5 tests passing');
  });

  it('includes current code in user message', () => {
    const result = buildHintPrompt({
      ...problemContext,
      currentCode: 'def two_sum(): pass',
      level: 1,
    });
    expect(result.user).toContain('def two_sum(): pass');
  });
});

describe('buildCoachPrompt', () => {
  it('returns system string only', () => {
    const result = buildCoachPrompt(problemContext);
    expect(result).toHaveProperty('system');
    expect(result).not.toHaveProperty('user');
    expect(typeof result.system).toBe('string');
  });

  it('includes encouraging language', () => {
    const result = buildCoachPrompt(problemContext);
    const lower = result.system.toLowerCase();
    expect(lower).toMatch(/encouraging|supportive|celebrate|confidence/);
  });

  it('includes guiding question approach', () => {
    const result = buildCoachPrompt(problemContext);
    expect(result.system.toLowerCase()).toMatch(/guiding questions|ask.*questions/);
  });

  it('forbids full solution code', () => {
    const result = buildCoachPrompt(problemContext);
    expect(result.system.toLowerCase()).toContain('never provide full solution code');
    expect(result.system.toLowerCase()).toContain('never provide pseudocode');
  });

  it('enforces concise response format for readability', () => {
    const result = buildCoachPrompt(problemContext);
    const lower = result.system.toLowerCase();
    expect(lower).toContain('max 120 words');
    expect(lower).toContain('max 4 bullets');
    expect(lower).toContain('short sections');
  });

  it('mentions problem context', () => {
    const result = buildCoachPrompt(problemContext);
    expect(result.system).toContain('Two Sum');
    expect(result.system).toContain('HASH_MAPS');
    expect(result.system).toContain('EASY');
  });
});

describe('buildInterviewerPrompt', () => {
  it('returns system string only', () => {
    const result = buildInterviewerPrompt(problemContext);
    expect(result).toHaveProperty('system');
    expect(result).not.toHaveProperty('user');
    expect(typeof result.system).toBe('string');
  });

  it('includes Socratic questioning guidance', () => {
    const result = buildInterviewerPrompt(problemContext);
    expect(result.system.toLowerCase()).toContain('socratic');
  });

  it('includes clarifying questions approach', () => {
    const result = buildInterviewerPrompt(problemContext);
    expect(result.system.toLowerCase()).toMatch(/clarifying questions|ask.*clarifying/);
  });

  it('forbids providing solution code', () => {
    const result = buildInterviewerPrompt(problemContext);
    expect(result.system.toLowerCase()).toContain('never provide solution code');
  });

  it('includes evaluation criteria', () => {
    const result = buildInterviewerPrompt(problemContext);
    expect(result.system.toLowerCase()).toMatch(
      /problem understanding|approach selection|communication/,
    );
  });

  it('enforces concise interviewer replies', () => {
    const result = buildInterviewerPrompt(problemContext);
    const lower = result.system.toLowerCase();
    expect(lower).toContain('max 90 words');
    expect(lower).toContain('one primary question');
  });

  it('mentions problem context', () => {
    const result = buildInterviewerPrompt(problemContext);
    expect(result.system).toContain('Two Sum');
    expect(result.system).toContain('HASH_MAPS');
  });
});

describe('buildSummaryPrompt', () => {
  const summaryInput = {
    title: 'Two Sum',
    pattern: 'HASH_MAPS',
    finalCode: 'def two_sum(nums, target): ...',
    testResults: { passed: 5, total: 5 },
    hintsUsed: 2,
    timeSpentSeconds: 600,
  };

  it('returns system and user strings', () => {
    const result = buildSummaryPrompt(summaryInput);
    expect(result).toHaveProperty('system');
    expect(result).toHaveProperty('user');
    expect(typeof result.system).toBe('string');
    expect(typeof result.user).toBe('string');
  });

  it('asks for structured output with strengths, weaknesses, suggestions', () => {
    const result = buildSummaryPrompt(summaryInput);
    const lower = result.system.toLowerCase();
    expect(lower).toContain('strengths');
    expect(lower).toContain('areas for improvement');
    expect(lower).toContain('suggestions for next steps');
    expect(lower).toContain('complexity note');
  });

  it('includes session stats in user message', () => {
    const result = buildSummaryPrompt(summaryInput);
    expect(result.user).toContain('5/5 tests passing');
    expect(result.user).toContain('Hints Used:** 2');
    expect(result.user).toContain('10 minute');
  });

  it('includes final code in user message', () => {
    const result = buildSummaryPrompt(summaryInput);
    expect(result.user).toContain('def two_sum(nums, target)');
  });

  it('includes problem details in user message', () => {
    const result = buildSummaryPrompt(summaryInput);
    expect(result.user).toContain('Two Sum');
    expect(result.user).toContain('HASH_MAPS');
  });
});
