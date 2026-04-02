import { describe, expect, it } from 'vitest';
import { createSingleTextSseResponse } from '../sse';

describe('createSingleTextSseResponse', () => {
  it('returns text/event-stream response', async () => {
    const response = createSingleTextSseResponse('hello world');

    expect(response.headers.get('Content-Type')).toContain('text/event-stream');
    expect(response.headers.get('Cache-Control')).toContain('no-cache');

    const payload = await response.text();
    expect(payload).toContain('data: {"type":"text-start","text":"hello world"}');
    expect(payload).toContain('data: [DONE]');
  });
});
