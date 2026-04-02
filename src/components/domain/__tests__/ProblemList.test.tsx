import { render, screen, waitFor } from '@testing-library/react';
import ProblemList from '../ProblemList';

const mockReplace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => '/practice',
  useSearchParams: () => new URLSearchParams(''),
}));

vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const mockProblems = [
  {
    id: '1',
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'EASY',
    pattern: 'ARRAYS_STRINGS',
    testCaseCount: 3,
    mastery: null,
    sessionStatus: null,
  },
  {
    id: '2',
    title: 'Longest Substring',
    slug: 'longest-substring',
    difficulty: 'MEDIUM',
    pattern: 'SLIDING_WINDOW',
    testCaseCount: 5,
    mastery: null,
    sessionStatus: null,
  },
];

describe('ProblemList', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn();
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows loading skeleton initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}));

    render(<ProblemList />);

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders problem list after fetch resolves', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProblems,
    } as Response);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dailyChallenge: null }),
    } as Response);

    render(<ProblemList />);

    await waitFor(() => {
      expect(screen.getByText('Two Sum')).toBeInTheDocument();
    });

    expect(screen.getByText('Longest Substring')).toBeInTheDocument();
    expect(screen.getByText('3 test cases')).toBeInTheDocument();
    expect(screen.getByText('5 test cases')).toBeInTheDocument();
  });

  it('shows error message with retry on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    } as Response);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dailyChallenge: null }),
    } as Response);

    render(<ProblemList />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load problems/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('shows empty state when no problems returned', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    } as Response);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dailyChallenge: null }),
    } as Response);

    render(<ProblemList />);

    await waitFor(() => {
      expect(screen.getByText(/no problems match your filters/i)).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('renders difficulty badges', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProblems,
    } as Response);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dailyChallenge: null }),
    } as Response);

    render(<ProblemList />);

    await waitFor(() => {
      expect(screen.getAllByText('EASY').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText('MEDIUM').length).toBeGreaterThanOrEqual(1);
  });

  it('renders pattern badges', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProblems,
    } as Response);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dailyChallenge: null }),
    } as Response);

    render(<ProblemList />);

    await waitFor(() => {
      expect(screen.getAllByText('Arrays Strings').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getAllByText('Sliding Window').length).toBeGreaterThanOrEqual(1);
  });

  it('requests personalized problems with no-store cache policy', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockProblems,
    } as Response);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ dailyChallenge: null }),
    } as Response);

    render(<ProblemList />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    const firstCall = mockFetch.mock.calls[0];
    expect(firstCall[0]).toContain('/api/problems?');
    expect(firstCall[1]).toMatchObject({ cache: 'no-store' });
  });
});
