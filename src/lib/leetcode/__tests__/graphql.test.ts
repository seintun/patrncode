import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchLeetCodeProblem } from '../graphql';

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe('fetchLeetCodeProblem', () => {
  it('builds a question query without deprecated constraints field', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            question: {
              questionId: '1',
              questionFrontendId: '1',
              title: 'Two Sum',
              titleSlug: 'two-sum',
              content: '<p>Given...</p>',
              difficulty: 'Easy',
              topicTags: [],
              codeSnippets: [],
              hints: [],
              exampleTestcases: '[]',
            },
          },
        }),
        { status: 200 },
      ),
    );

    global.fetch = fetchMock as typeof fetch;

    await fetchLeetCodeProblem('two-sum');

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const body = JSON.parse(String(init.body)) as { query: string };

    expect(body.query).not.toContain('constraints');
    expect(body.query).toContain('exampleTestcases');
  });
});
