import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import Link from 'next/link';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SessionPage from '../page';

const mockPush = vi.fn();

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'session-1' }),
  useRouter: () => ({ push: mockPush }),
}));

vi.mock('next/dynamic', () => ({
  default: () => () => <div data-testid="code-editor" />,
}));

vi.mock('@/components/domain/SessionLayout', () => ({
  SessionLayout: () => (
    <div>
      <Link href="/practice">Practice</Link>
    </div>
  ),
}));

vi.mock('@/components/domain/ProblemPanel', () => ({
  ProblemPanel: () => <div />,
}));

vi.mock('@/components/domain/TestResults', () => ({
  TestResults: () => <div />,
}));

vi.mock('@/components/domain/CoachingPanel', () => ({
  CoachingPanel: () => <div />,
}));

vi.mock('@/components/domain/SessionTimer', () => ({
  SessionTimer: () => <div />,
}));

vi.mock('@/components/ui/Skeleton', () => ({
  Skeleton: () => <div />,
}));

vi.mock('@/components/ui/AIBanner', () => ({
  AIBanner: () => <div />,
}));

vi.mock('@/components/ui/ErrorBoundary', () => ({
  ErrorBoundary: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock('@/hooks/useAIChat', () => ({
  useAIChat: () => ({
    messages: [],
    sendChat: vi.fn(),
    isLoading: false,
    hintStream: { isLoading: false },
    getHint: vi.fn(),
    explanationStream: { isLoading: false },
    getExplanation: vi.fn(),
    askAboutFailure: vi.fn(),
    setMessages: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCodeExecution', () => ({
  useCodeExecution: () => ({
    run: vi.fn(),
    results: null,
    isRunning: false,
    prewarmWorker: vi.fn(),
  }),
}));

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: vi.fn(),
}));

vi.mock('@/components/ui/Button', () => ({
  Button: ({ children, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  ),
}));

const sessionResponse = {
  id: 'session-1',
  guestId: 'guest-1',
  problemId: 'problem-1',
  mode: 'SELF_PRACTICE',
  status: 'IN_PROGRESS',
  code: 'print("hello")',
  problem: {
    id: 'problem-1',
    title: 'Two Sum',
    statement: 'Find two numbers.',
    pattern: 'HASH_MAPS',
    difficulty: 'EASY',
    examples: [],
    constraints: [],
    starterCode: 'def two_sum(nums, target):\n    pass',
    testCases: [],
  },
  startedAt: new Date().toISOString(),
  runs: [],
  hints: [],
  messages: [],
  expiresAt: null,
};

function createJsonResponse(data: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: async () => data,
  } as unknown as Response;
}

describe('SessionPage leave guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.history.replaceState({}, '', '/session/session-1');

    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!init?.method || init.method === 'GET') {
        return createJsonResponse(sessionResponse);
      }

      if (init.method === 'PATCH') {
        return createJsonResponse({ ok: true });
      }

      return createJsonResponse({}, false, 404);
    }) as unknown as typeof fetch;
  });

  it('shows leave confirmation when clicking in-app link during active session', async () => {
    const user = userEvent.setup();
    render(<SessionPage />);

    const practiceLink = await screen.findByRole('link', { name: 'Practice' });
    await user.click(practiceLink);

    expect(screen.getByText('Leave session?')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Your current code will be saved, and this session will be ended. You can resume from the problem page later.',
      ),
    ).toBeInTheDocument();
  });

  it('abandons session and navigates after leave confirmation', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(global.fetch);

    render(<SessionPage />);

    const practiceLink = await screen.findByRole('link', { name: 'Practice' });
    await user.click(practiceLink);
    await user.click(screen.getByRole('button', { name: 'Save & Leave' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/practice');
    });

    const patchCall = fetchMock.mock.calls.find(([, init]) => init?.method === 'PATCH');
    expect(patchCall).toBeDefined();
    expect(patchCall?.[0]).toBe('/api/sessions/session-1');
    expect(JSON.parse(String(patchCall?.[1]?.body))).toEqual({
      status: 'ABANDONED',
      code: 'print("hello")',
    });
  });

  it('stays on page when leave confirmation is cancelled', async () => {
    const user = userEvent.setup();
    const fetchMock = vi.mocked(global.fetch);

    render(<SessionPage />);

    const practiceLink = await screen.findByRole('link', { name: 'Practice' });
    await user.click(practiceLink);
    await user.click(screen.getByRole('button', { name: 'Stay Here' }));

    expect(screen.queryByText('Leave session?')).not.toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(false);
  });

  it('still navigates after confirming leave when abandon request throws', async () => {
    const user = userEvent.setup();
    global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!init?.method || init.method === 'GET') {
        return createJsonResponse(sessionResponse);
      }

      if (init.method === 'PATCH') {
        throw new Error('network error');
      }

      return createJsonResponse({}, false, 404);
    }) as unknown as typeof fetch;
    const fetchMock = vi.mocked(global.fetch);

    render(<SessionPage />);

    const practiceLink = await screen.findByRole('link', { name: 'Practice' });
    await user.click(practiceLink);

    expect(screen.getByText('Leave session?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save & Leave' }));

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/practice');
    });

    expect(fetchMock.mock.calls.some(([, init]) => init?.method === 'PATCH')).toBe(true);
  });
});
