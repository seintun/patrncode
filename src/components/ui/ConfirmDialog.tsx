'use client';

import { useEffect, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmVariant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = 'confirm-dialog-title';
  const descriptionId = 'confirm-dialog-description';

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    },
    [onCancel],
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Focus the dialog for accessibility
      dialogRef.current?.focus();
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-[var(--color-bg-primary)]/60 backdrop-blur-md animate-in fade-in duration-300"
      onClick={onCancel}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="max-w-md w-full mx-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-6 shadow-2xl animate-in zoom-in-95 duration-200 focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id={titleId}
          className="mb-2 text-xl font-bold text-[var(--color-text-primary)] leading-tight"
        >
          {title}
        </h2>
        <p
          id={descriptionId}
          className="mb-6 text-sm text-[var(--color-text-secondary)] leading-relaxed"
        >
          {message}
        </p>
        <div className="flex gap-3">
          <Button
            onClick={onConfirm}
            className={cn(
              'flex-1 border-none',
              confirmVariant === 'danger'
                ? 'bg-[var(--color-error)] text-white hover:bg-[var(--color-error)]/80'
                : '',
            )}
          >
            {confirmLabel}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="flex-1 border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]"
          >
            {cancelLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
