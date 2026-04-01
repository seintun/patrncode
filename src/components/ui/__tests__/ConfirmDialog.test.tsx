import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ConfirmDialog } from '../ConfirmDialog';

describe('ConfirmDialog', () => {
  const defaultProps = {
    isOpen: true,
    title: 'Confirm Action',
    message: 'Are you sure you want to proceed?',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
  };

  it('renders when isOpen=true', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByText('Confirm Action')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to proceed?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('does not render when isOpen=false', () => {
    render(<ConfirmDialog {...defaultProps} isOpen={false} />);
    expect(screen.queryByText('Confirm Action')).not.toBeInTheDocument();
  });

  it('calls onCancel when backdrop clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    const backdrop = screen.getByRole('dialog').parentElement;
    expect(backdrop).toBeTruthy();
    await user.click(backdrop as HTMLElement);

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('does not call onCancel when dialog content clicked', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    const dialog = screen.getByText('Confirm Action').closest('.max-w-md')!;
    await user.click(dialog);

    expect(onCancel).not.toHaveBeenCalled();
  });

  it('calls onCancel when Escape pressed', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(<ConfirmDialog {...defaultProps} onCancel={onCancel} />);

    await user.keyboard('{Escape}');

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when confirm button clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(<ConfirmDialog {...defaultProps} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows default labels', () => {
    render(<ConfirmDialog {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Confirm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows custom labels', () => {
    render(
      <ConfirmDialog {...defaultProps} confirmLabel="Yes, delete" cancelLabel="No, keep it" />,
    );
    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'No, keep it' })).toBeInTheDocument();
  });

  it('applies danger variant styling to confirm button', () => {
    render(<ConfirmDialog {...defaultProps} confirmVariant="danger" />);
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmBtn.className).toContain('--color-error');
  });

  it('applies primary variant styling to confirm button', () => {
    render(<ConfirmDialog {...defaultProps} confirmVariant="primary" />);
    const confirmBtn = screen.getByRole('button', { name: 'Confirm' });
    expect(confirmBtn.className).toContain('--color-accent');
  });
});
