import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AIBanner } from '../AIBanner';

vi.stubGlobal('fetch', vi.fn());
const mockFetch = vi.mocked(fetch);

describe('AIBanner', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows nothing when API returns 200', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 200 }));

    const { container } = render(<AIBanner />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    expect(container.innerHTML).toBe('');
  });

  it('shows alert banner when API returns 503', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 503 }));

    render(<AIBanner />);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('AI features temporarily unavailable');
  });

  it('shows alert banner on fetch network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(<AIBanner />);

    const alert = await screen.findByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('AI features temporarily unavailable');
  });

  it('banner has role="alert"', async () => {
    mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }));

    render(<AIBanner />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveAttribute('role', 'alert');
  });
});
