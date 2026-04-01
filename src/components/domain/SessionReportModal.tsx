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
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? 'Failed to load report');
        if (mounted) setReport(json.report as SessionReport);
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
          <button onClick={onClose} className="text-[var(--color-text-muted)]">
            ×
          </button>
        </div>

        {loading && <p className="text-sm text-[var(--color-text-muted)]">Generating report...</p>}
        {error && <p className="text-sm text-[var(--color-error)]">{error}</p>}

        {report && (
          <div className="space-y-4 text-sm">
            <section>
              <h4 className="mb-1 font-semibold text-[var(--color-text-primary)]">Strengths</h4>
              <textarea
                value={report.strengths}
                onChange={(e) => setReport({ ...report, strengths: e.target.value })}
                className="min-h-24 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2"
              />
            </section>
            <section>
              <h4 className="mb-1 font-semibold text-[var(--color-text-primary)]">
                Areas to Improve
              </h4>
              <textarea
                value={report.areasToImprove}
                onChange={(e) => setReport({ ...report, areasToImprove: e.target.value })}
                className="min-h-20 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2"
              />
            </section>
            <section>
              <h4 className="mb-1 font-semibold text-[var(--color-text-primary)]">Next Steps</h4>
              <textarea
                value={report.nextSteps}
                onChange={(e) => setReport({ ...report, nextSteps: e.target.value })}
                className="min-h-20 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2"
              />
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
