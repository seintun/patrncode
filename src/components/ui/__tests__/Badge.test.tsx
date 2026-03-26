import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Badge } from '../Badge';

describe('Badge', () => {
  describe('difficulty variant', () => {
    it('renders EASY badge with green styles', () => {
      render(<Badge variant="difficulty" value="EASY" />);
      const badge = screen.getByText('EASY');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('--color-success');
    });

    it('renders MEDIUM badge with yellow styles', () => {
      render(<Badge variant="difficulty" value="MEDIUM" />);
      const badge = screen.getByText('MEDIUM');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('--color-warning');
    });

    it('renders HARD badge with red styles', () => {
      render(<Badge variant="difficulty" value="HARD" />);
      const badge = screen.getByText('HARD');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('--color-error');
    });
  });

  describe('pattern variant', () => {
    it('renders pattern badge with accent color', () => {
      render(<Badge variant="pattern" value="Hash Maps" />);
      const badge = screen.getByText('Hash Maps');
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain('--color-accent');
    });
  });

  describe('mastery variant', () => {
    it('renders UNSEEN mastery state', () => {
      render(<Badge variant="mastery" value="UNSEEN" />);
      expect(screen.getByText('UNSEEN')).toBeInTheDocument();
    });

    it('renders MASTERED mastery state with green', () => {
      render(<Badge variant="mastery" value="MASTERED" />);
      const badge = screen.getByText('MASTERED');
      expect(badge.className).toContain('--color-success');
    });

    it('renders NEEDS_REFRESH with error color', () => {
      render(<Badge variant="mastery" value="NEEDS_REFRESH" />);
      const badge = screen.getByText('NEEDS REFRESH');
      expect(badge.className).toContain('--color-error');
    });
  });

  it('merges custom className', () => {
    render(<Badge variant="difficulty" value="EASY" className="extra" />);
    const badge = screen.getByText('EASY');
    expect(badge.className).toContain('extra');
  });
});
