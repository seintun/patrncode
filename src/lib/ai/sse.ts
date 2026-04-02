export function createSingleTextSseResponse(text: string): Response {
  const payload = [
    `data: ${JSON.stringify({ type: 'text-start', text })}`,
    '',
    'data: [DONE]',
    '',
  ].join('\n');

  return new Response(payload, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
