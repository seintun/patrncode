import { describe, expect, it } from 'vitest';
import { sanitizeCoachingContent } from '../safety';

describe('sanitizeCoachingContent', () => {
  it('removes fenced code blocks to prevent copy-paste solutions', () => {
    const input = `Use this approach:\n\n\`\`\`python\ndef twoSum(nums, target):\n  return [0, 1]\n\`\`\`\n\nReason about complements.`;
    const output = sanitizeCoachingContent(input);

    expect(output).toContain('[Code removed by coach safety policy]');
    expect(output).not.toContain('def twoSum');
    expect(output).toContain('Reason about complements.');
  });
});
