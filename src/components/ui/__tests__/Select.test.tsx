import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../Select';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

describe('Select', () => {
  it('renders select element with options', () => {
    render(<Select options={options} onChange={() => {}} />);
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('calls onChange with value string when selection changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Select options={options} onChange={onChange} />);

    await user.selectOptions(screen.getByRole('combobox'), 'b');
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('shows placeholder option when provided', () => {
    render(<Select options={options} placeholder="Pick one" onChange={() => {}} />);
    expect(screen.getByText('Pick one')).toBeInTheDocument();
  });

  it('disabled placeholder cannot be selected', () => {
    render(<Select options={options} placeholder="Pick one" onChange={() => {}} />);
    const placeholderOption = screen.getByText('Pick one');
    expect(placeholderOption).toHaveAttribute('disabled');
  });

  it('merges custom className', () => {
    render(<Select options={options} onChange={() => {}} className="custom-sel" />);
    const select = screen.getByRole('combobox');
    expect(select.className).toContain('custom-sel');
    expect(select.className).toContain('w-full');
  });
});
