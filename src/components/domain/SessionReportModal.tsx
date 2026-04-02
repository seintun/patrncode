'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

interface SessionReportModalProps {
  open: boolean;
  sessionId: string;
  onClose: () => void;
}

interface SessionReport {
  strengths: string;
  areasToImprove: string;
  nextSteps: string;
  complexityNote: string;
}

export function SessionReportModal({ open, sessionId, onClose }: SessionReportModalProps) {
  const [report, setReport] = useState<SessionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !sessionId) return;
    let mounted = true;

    async function fetchReport() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/sessions/${sessionId}/report`, { cache: 'no-store' });
        const text = await res.text();
        let json: Record<string, unknown> | null = null;

        if (text) {
          try {
            json = JSON.parse(text) as Record<string, unknown>;
          } catch {
            json = null;
          }
        }

        if (!res.ok) {
          const message =
            (json && typeof json.error === 'string' ? json.error : null) ||
            text ||
            'Failed to load report';
          throw new Error(message);
        }

        if (mounted && json && json.report) {
          setReport(json.report as SessionReport);
        }
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Failed to load report');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchReport();
    return () => {
      mounted = false;
    };
  }, [open, sessionId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-elevated)] p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Session Report</h3>
          <button
            type="button"
            aria-label="Close session report"
            onClick={onClose}
            className="text-[var(--color-text-muted)]"
          >
            ×
          </button>
        </div>

        {loading && <p className="text-sm text-[var(--color-text-muted)]">Generating report...</p>}
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        {report && (
          <div className="space-y-4 text-sm">
            <section>
              <h4 className="mb-1 font-semibold text-[var(--color-text-primary)]">Strengths</h4>
              <p className="whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2">
                {report.strengths || 'No strengths captured yet.'}
              </p>
            </section>
            <section>
              <h4 className="mb-1 font-semibold text-[var(--color-text-primary)]">
                Areas to Improve
              </h4>
              <p className="whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2">
                {report.areasToImprove || 'No improvement notes yet.'}
              </p>
            </section>
            <section>
              <h4 className="mb-1 font-semibold text-[var(--color-text-primary)]">Next Steps</h4>
              <p className="whitespace-pre-wrap rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2">
                {report.nextSteps || 'No next steps yet.'}
              </p>
            </section>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionReportModal;
