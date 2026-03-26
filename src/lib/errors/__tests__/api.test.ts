import { handleApiError, withErrorHandling, withErrorHandlingParams } from '../api';

async function parseJson(res: Response) {
  return res.json() as Promise<{ error: string; status: number; details?: unknown }>;
}

describe('handleApiError', () => {
  it('returns correct status', async () => {
    const res = await handleApiError(new Response('', { status: 404 }), new Error('nope'));
    expect(res.status).toBe(404);
    const body = await parseJson(res);
    expect(body.status).toBe(404);
  });

  it('extracts message from Error instance', async () => {
    const res = await handleApiError(new Response('', { status: 500 }), new Error('boom'));
    const body = await parseJson(res);
    expect(body.error).toBe('boom');
  });

  it('extracts message from string error', async () => {
    const res = await handleApiError(new Response('', { status: 400 }), 'bad input');
    const body = await parseJson(res);
    expect(body.error).toBe('bad input');
  });

  it('uses generic message for non-Error non-string', async () => {
    const res = await handleApiError(new Response('', { status: 500 }), 42);
    const body = await parseJson(res);
    expect(body.error).toBe('An unexpected error occurred');
  });

  it('prefixes with context when provided', async () => {
    const res = await handleApiError(new Response('', { status: 500 }), new Error('fail'), 'AUTH');
    const body = await parseJson(res);
    expect(body.error).toBe('[AUTH] fail');
  });

  it('does not include details in test env', async () => {
    const res = await handleApiError(new Response('', { status: 500 }), new Error('no details'));
    const body = await parseJson(res);
    expect(body.details).toBeUndefined();
  });

  it('includes stack details in development env', async () => {
    const originalEnv = process.env.NODE_ENV;
    (process.env as Record<string, string>).NODE_ENV = 'development';

    const error = new Error('dev error');
    const res = await handleApiError(new Response('', { status: 500 }), error);
    const body = await parseJson(res);
    expect(body.details).toEqual({
      stack: error.stack,
      name: error.name,
    });

    (process.env as Record<string, string>).NODE_ENV = originalEnv ?? 'test';
  });
});

describe('withErrorHandling', () => {
  it('calls handler and returns its response', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    const wrapped = withErrorHandling(handler);
    const req = {} as any;
    const res = await wrapped(req);
    expect(handler).toHaveBeenCalledWith(req);
    expect(res.status).toBe(200);
  });

  it('catches error and returns 500', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('broken'));
    const wrapped = withErrorHandling(handler);
    const req = {} as any;
    const res = await wrapped(req);
    expect(res.status).toBe(500);
    const body = await parseJson(res);
    expect(body.error).toBe('broken');
  });
});

describe('withErrorHandlingParams', () => {
  it('passes req and params to handler', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }));
    const wrapped = withErrorHandlingParams(handler);
    const req = {} as any;
    const params = Promise.resolve({ id: '123' } as Record<string, string>);
    const res = await wrapped(req, params);
    expect(handler).toHaveBeenCalledWith(req, params);
    expect(res.status).toBe(200);
  });

  it('catches error and returns 500', async () => {
    const handler = vi.fn().mockRejectedValue(new Error('params broken'));
    const wrapped = withErrorHandlingParams(handler);
    const req = {} as any;
    const params = Promise.resolve({} as Record<string, string>);
    const res = await wrapped(req, params);
    expect(res.status).toBe(500);
    const body = await parseJson(res);
    expect(body.error).toBe('params broken');
  });
});
