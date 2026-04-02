'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

type Theme = 'DARK' | 'LIGHT' | 'SYSTEM';
type FontSize = 'SMALL' | 'MEDIUM' | 'LARGE';
type KeybindingScheme = 'VSCODE' | 'VIM' | 'EMACS' | 'NONE';

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const [theme, setTheme] = useState<Theme>('SYSTEM');
  const [fontSize, setFontSize] = useState<FontSize>('MEDIUM');
  const [keybindingScheme, setKeybindingScheme] = useState<KeybindingScheme>('VSCODE');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    async function load() {
      const res = await fetch('/api/user/profile', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data.theme) setTheme(data.theme as Theme);
      if (data.fontSize) setFontSize(data.fontSize as FontSize);
      if (data.keybindingScheme) setKeybindingScheme(data.keybindingScheme as KeybindingScheme);
    }
    load();
  }, [open]);

  if (!open) return null;

  const save = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, fontSize, keybindingScheme }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error ?? 'Failed to save settings');
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/40">
      <div className="h-full w-full max-w-md border-l border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Settings</h3>
          <button
            type="button"
            aria-label="Close settings"
            onClick={onClose}
            className="text-[var(--color-text-muted)]"
          >
            ×
          </button>
        </div>

        <div className="space-y-5 text-sm">
          <label className="block">
            <span className="mb-1 block text-[var(--color-text-secondary)]">Theme</span>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as Theme)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2"
            >
              <option value="DARK">Dark</option>
              <option value="LIGHT">Light</option>
              <option value="SYSTEM">System</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[var(--color-text-secondary)]">Editor Font Size</span>
            <select
              value={fontSize}
              onChange={(e) => setFontSize(e.target.value as FontSize)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2"
            >
              <option value="SMALL">Small (14px)</option>
              <option value="MEDIUM">Medium (16px)</option>
              <option value="LARGE">Large (18px)</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-[var(--color-text-secondary)]">Keybindings</span>
            <select
              value={keybindingScheme}
              onChange={(e) => setKeybindingScheme(e.target.value as KeybindingScheme)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2"
            >
              <option value="VSCODE">VS Code</option>
              <option value="VIM">Vim</option>
              <option value="EMACS">Emacs</option>
              <option value="NONE">None</option>
            </select>
          </label>

          <Button onClick={save} disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          {error ? <p className="text-sm text-[var(--color-error)]">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}

export default SettingsPanel;
