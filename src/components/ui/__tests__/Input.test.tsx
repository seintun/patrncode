import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { Input } from '../Input';

describe('Input', () => {
  it('renders an input element', () => {
    render(<Input />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('accepts type prop', () => {
    render(<Input type="password" aria-label="pw" />);
    expect(screen.getByLabelText('pw')).toHaveAttribute('type', 'password');
  });

  it('forwards ref', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} />);
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('merges custom className', () => {
    render(<Input className="my-custom" />);
    const input = screen.getByRole('textbox');
    expect(input.className).toContain('my-custom');
    expect(input.className).toContain('w-full');
  });

  it('shows placeholder text', () => {
    render(<Input placeholder="Enter text" />);
    expect(screen.getByPlaceholderText('Enter text')).toBeInTheDocument();
  });

  it('onChange handler fires', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Input onChange={onChange} />);

    await user.type(screen.getByRole('textbox'), 'abc');
    expect(onChange).toHaveBeenCalledTimes(3);
  });
});
