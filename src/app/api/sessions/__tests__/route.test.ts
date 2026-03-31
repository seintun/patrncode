/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST, GET } from '../route';
import { prisma } from '@/lib/db/prisma';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    session: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}));

const mockGuestId = 'test-guest-id';
const mockProblemId = 'clxp1234567890abcdefghijkl';

describe('POST /api/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: mockGuestId }),
    } as any);
  });

  it('returns 201 and creates session when no active session exists', async () => {
    vi.mocked(prisma.session.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.session.create).mockResolvedValue({ id: 'new-session-id' } as any);

    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ problemId: mockProblemId, mode: 'SELF_PRACTICE' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe('new-session-id');
  });

  it('returns 409 when an active session already exists for the problem', async () => {
    vi.mocked(prisma.session.findFirst).mockResolvedValue({
      id: 'existing-session-id',
      mode: 'SELF_PRACTICE',
    } as any);

    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ problemId: mockProblemId, mode: 'COACH_ME' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toMatch(/active session already exists/i);
    expect(data.sessionId).toBe('existing-session-id');
  });

  it('returns 400 when required fields are missing', async () => {
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ problemId: mockProblemId }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it('returns 400 for an invalid problemId format', async () => {
    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ problemId: 'not-a-valid-id!!!', mode: 'SELF_PRACTICE' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/invalid problemid format/i);
  });

  it('returns 401 if guest cookie is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const req = new NextRequest('http://localhost/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ problemId: mockProblemId, mode: 'SELF_PRACTICE' }),
      headers: { 'Content-Type': 'application/json' },
    });

    const response = await POST(req);
    expect(response.status).toBe(401);
  });
});

describe('GET /api/sessions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: mockGuestId }),
    } as any);
  });

  it('returns the active session when one exists for the problem', async () => {
    const mockSession = {
      id: 'active-session-id',
      mode: 'SELF_PRACTICE',
      startedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    };
    vi.mocked(prisma.session.findFirst).mockResolvedValue(mockSession as any);

    const req = new NextRequest(`http://localhost/api/sessions?problemId=${mockProblemId}`);

    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.session).toBeDefined();
    expect(data.session.id).toBe('active-session-id');
  });

  it('returns null session when no active session exists', async () => {
    vi.mocked(prisma.session.findFirst).mockResolvedValue(null);

    const req = new NextRequest(`http://localhost/api/sessions?problemId=${mockProblemId}`);

    const response = await GET(req);
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.session).toBeNull();
  });

  it('returns 400 when problemId is missing', async () => {
    const req = new NextRequest('http://localhost/api/sessions');

    const response = await GET(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/missing problemid/i);
  });

  it('returns 400 for an invalid problemId format', async () => {
    const req = new NextRequest('http://localhost/api/sessions?problemId=not-valid!!!');

    const response = await GET(req);
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toMatch(/invalid problemid format/i);
  });

  it('returns 401 if guest cookie is missing', async () => {
    vi.mocked(cookies).mockResolvedValue({
      get: vi.fn().mockReturnValue(undefined),
    } as any);

    const req = new NextRequest(`http://localhost/api/sessions?problemId=${mockProblemId}`);

    const response = await GET(req);
    expect(response.status).toBe(401);
  });
});
