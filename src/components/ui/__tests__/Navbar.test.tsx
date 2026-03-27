import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import Navbar from '../Navbar';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
}));

describe('Navbar', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/');
    vi.clearAllMocks();
  });

  it('renders all navigation links', () => {
    render(<Navbar />);
    expect(screen.getAllByText('Practice').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Blog').length).toBeGreaterThan(0);
  });

  it('highlights the active link including subpaths', () => {
    mockUsePathname.mockReturnValue('/practice/two-sum');
    render(<Navbar />);

    const practiceLinks = screen.getAllByText('Practice');
    // Mobile and desktop links should both show active state
    practiceLinks.forEach((link) => {
      expect(link.className).toContain('text-[var(--color-accent)]');
    });
  });

  it('toggles mobile menu on hamburger click', () => {
    render(<Navbar />);

    // Menu should be hidden initially
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    // The ul does not have role=menu anymore, it's just a ul. Screen readers find it implicitly if visible
    // But we query by the id "mobile-menu" block
    const getMobileMenu = () => document.getElementById('mobile-menu');

    expect(getMobileMenu()).not.toBeInTheDocument();

    // Click toggle button
    const toggleBtn = screen.getByRole('button');
    fireEvent.click(toggleBtn);

    expect(getMobileMenu()).toBeInTheDocument();

    // Click again to close
    fireEvent.click(toggleBtn);
    expect(getMobileMenu()).not.toBeInTheDocument();
  });

  it('closes mobile menu on escape key', () => {
    render(<Navbar />);

    // Open menu
    const toggleBtn = screen.getByRole('button');
    fireEvent.click(toggleBtn);
    expect(document.getElementById('mobile-menu')).toBeInTheDocument();

    // Press escape
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(document.getElementById('mobile-menu')).not.toBeInTheDocument();
  });

  it('closes mobile menu on link click', () => {
    render(<Navbar />);

    // Open menu
    const toggleBtn = screen.getByRole('button');
    fireEvent.click(toggleBtn);

    expect(document.getElementById('mobile-menu')).toBeInTheDocument();

    // The first 'Practice' link is desktop, second is mobile.
    // Or just click the one inside the mobile menu
    const mobileLink = document.getElementById('mobile-menu')?.querySelector('a');
    if (mobileLink) {
      fireEvent.click(mobileLink);
    }

    expect(document.getElementById('mobile-menu')).not.toBeInTheDocument();
  });
});
