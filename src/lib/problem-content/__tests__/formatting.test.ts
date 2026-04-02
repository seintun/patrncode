import { describe, expect, it } from 'vitest';
import { decodeHtmlEntities, formatExampleExplanation, stripTrailingSections } from '../formatting';

describe('problem content formatting', () => {
  it('decodes nested HTML entities', () => {
    expect(decodeHtmlEntities('0 --&amp;gt; 0 &amp;amp; 1')).toBe('0 --> 0 & 1');
  });

  it('removes trailing constraints and follow-up text', () => {
    expect(stripTrailingSections('0 --> 0 Constraints: n <= 10')).toBe('0 --> 0');
    expect(stripTrailingSections('0 --> 0 Follow-up: O(n)?')).toBe('0 --> 0');
  });

  it('formats explanation arrows and semicolon-separated steps for readability', () => {
    const explanation = '0 --&gt; 0 1 --&gt; 1; 2 --&gt; 10';
    expect(formatExampleExplanation(explanation)).toBe('0 → 0\n1 → 1\n2 → 10');
  });
});
