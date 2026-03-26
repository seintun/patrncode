import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Card } from '../Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('has no button role when onClick not provided', () => {
    render(<Card>Static</Card>);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has role="button" and tabIndex=0 when onClick provided', () => {
    render(<Card onClick={() => {}}>Clickable</Card>);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabindex', '0');
  });

  it('calls onClick on click', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Click me</Card>);

    await user.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onClick on Enter keydown', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Key</Card>);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('calls onClick on Space keydown', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Card onClick={onClick}>Key</Card>);

    const card = screen.getByRole('button');
    card.focus();
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('has cursor pointer class when onClick', () => {
    render(<Card onClick={() => {}}>Styled</Card>);
    const card = screen.getByRole('button');
    expect(card.className).toContain('cursor-pointer');
  });
});
