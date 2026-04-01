import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SessionSummaryPage from '../page';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'session-1' }),
  useRouter: () => ({ replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock('next/image', () => ({
  default: ({
    fill: _fill,
    ...props
  }: React.ImgHTMLAttributes<HTMLImageElement> & { fill?: boolean }) => (
    <img {...props} alt={props.alt ?? ''} />
  ),
}));

function createResponse(data: unknown): Response {
  return {
    ok: true,
    json: async () => data,
  } as Response;
}

const baseSession = {
  id: 'session-1',
  problemId: 'problem-1',
  mode: 'COACH_ME',
  outcome: null,
  startedAt: '2026-03-31T00:00:00.000Z',
  completedAt: '2026-03-31T00:12:00.000Z',
  feedback: null,
  runs: [{ passed: 2, total: 5 }],
  hints: [{ id: 'hint-1' }],
  problem: {
    title: 'Two Sum',
    slug: 'two-sum',
    pattern: 'HASH_MAPS',
    difficulty: 'EASY',
  },
};

describe('SessionSummaryPage status handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders abandoned session summary and skips feedback polling', async () => {
    global.fetch = vi.fn(async () =>
      createResponse({ ...baseSession, status: 'ABANDONED' }),
    ) as typeof fetch;

    render(<SessionSummaryPage />);

    expect(
      await screen.findByRole('heading', { name: 'Session ended', level: 1 }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('AI feedback is only generated for completed sessions.'),
    ).toBeInTheDocument();

    expect(screen.getByText('12m')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('redirects to active session when summary is requested before completion', async () => {
    global.fetch = vi.fn(async () =>
      createResponse({ ...baseSession, status: 'IN_PROGRESS' }),
    ) as typeof fetch;

    render(<SessionSummaryPage />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/session/session-1');
    });
  });
});
