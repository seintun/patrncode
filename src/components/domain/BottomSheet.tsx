'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

type SheetHeight = 'peek' | 'half' | 'full';

interface BottomSheetProps {
  open: boolean;
  height?: SheetHeight;
  onClose: () => void;
  dragHandle?: boolean;
  zIndex?: number;
  children: ReactNode;
}

// ── Constants ────────────────────────────────────────────────────────────────

const SNAP_HEIGHTS: Record<SheetHeight, string> = {
  peek: '40vh',
  half: '50vh',
  full: '90vh',
};

/** TranslateY when sheet is fully closed (hidden below viewport). */
const CLOSED_TRANSLATE = '100%';

/**
 * Fraction of the initial snap height you must drag downward before
 * the sheet snaps closed instead of snapping back.
 */
const CLOSE_THRESHOLD_FRACTION = 0.5;

const TRANSITION = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
const ANIMATION_MS = 300;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a vh string like "40vh" to pixel value. */
function vhToPx(vh: string): number {
  return (parseFloat(vh) / 100) * window.innerHeight;
}

/** CSS translateY that positions the sheet top edge at the correct height. */
function sheetTranslateForHeight(h: SheetHeight): string {
  return `calc(100vh - ${SNAP_HEIGHTS[h]})`;
}

// ── Component ────────────────────────────────────────────────────────────────

export const BottomSheet: FC<BottomSheetProps> = ({
  open,
  height = 'peek',
  onClose,
  dragHandle = true,
  zIndex = 10,
  children,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Drag state (refs — no re-renders during drag)
  const pointerStartY = useRef(0);
  const sheetStartTranslate = useRef(0);
  const isDragging = useRef(false);
  const animating = useRef(false);

  /**
   * Internal mounted state. We keep the DOM alive during the close animation
   * even after `open` becomes `false`, then unmount once the transition ends.
   */
  const [mounted, setMounted] = useState(open);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  const labelId = useId();

  // ── Reduced-motion detection ───────────────────────────────────────────
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const transitionStyle = reducedMotion ? 'none' : TRANSITION;
  const animDuration = reducedMotion ? 0 : ANIMATION_MS;

  // ── Lock body scroll while mounted ─────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // ── Sync open prop → animate in/out ────────────────────────────────────
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Immediately ensure DOM is mounted when open becomes true
  if (open && !mounted) {
    setMounted(true);
  }

  useLayoutEffect(() => {
    const sheet = sheetRef.current;
    const backdrop = backdropRef.current;
    if (!sheet || !backdrop) return;

    // Clear any pending close timer from a previous cycle
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (open) {
      // ── Opening ──
      // Start off-screen (no transition)
      sheet.style.transition = 'none';
      backdrop.style.transition = 'none';
      sheet.style.transform = `translateY(${CLOSED_TRANSLATE})`;
      backdrop.style.opacity = '0';

      // Force reflow so the browser registers the starting position
      void sheet.offsetHeight;

      // Animate in
      sheet.style.transition = transitionStyle;
      backdrop.style.transition = reducedMotion ? 'none' : 'opacity 0.3s ease';
      sheet.style.transform = sheetTranslateForHeight(height);
      backdrop.style.opacity = '1';
    } else if (mounted) {
      // ── Closing (only animate out if we were visible) ──
      sheet.style.transition = transitionStyle;
      backdrop.style.transition = reducedMotion ? 'none' : 'opacity 0.3s ease';
      sheet.style.transform = `translateY(${CLOSED_TRANSLATE})`;
      backdrop.style.opacity = '0';

      animating.current = true;
      closeTimerRef.current = setTimeout(() => {
        animating.current = false;
        setMounted(false);
      }, animDuration);
    }
  }, [open, height, transitionStyle, reducedMotion, animDuration, mounted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // ── Read current translateY from computed style ────────────────────────
  const getCurrentTranslatePx = useCallback((): number => {
    const sheet = sheetRef.current;
    if (!sheet) return 0;
    const m = new DOMMatrixReadOnly(getComputedStyle(sheet).transform);
    return m.m42;
  }, []);

  // ── Pointer drag ───────────────────────────────────────────────────────

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (animating.current) return;
      const sheet = sheetRef.current;
      if (!sheet) return;

      isDragging.current = true;
      pointerStartY.current = e.clientY;
      sheetStartTranslate.current = getCurrentTranslatePx();

      // Disable transition for immediate drag response
      sheet.style.transition = 'none';
      if (backdropRef.current) {
        backdropRef.current.style.transition = 'none';
      }

      sheet.setPointerCapture(e.pointerId);
    },
    [getCurrentTranslatePx],
  );

  const onPointerMove = useCallback((e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const sheet = sheetRef.current;
    if (!sheet) return;

    const deltaY = e.clientY - pointerStartY.current;
    const newTranslate = sheetStartTranslate.current + deltaY;

    // Clamp: don't allow dragging above the full-open position (90vh)
    const maxOpenTranslate = vhToPx('100vh') - vhToPx(SNAP_HEIGHTS.full);
    const clamped = Math.max(maxOpenTranslate, newTranslate);

    sheet.style.transform = `translateY(${clamped}px)`;

    // Update backdrop opacity based on drag progress toward closed
    if (backdropRef.current) {
      const closedPx = vhToPx('100vh');
      const denom = closedPx - maxOpenTranslate;
      const progress =
        denom > 0 ? Math.min(Math.max((clamped - maxOpenTranslate) / denom, 0), 1) : 0;
      backdropRef.current.style.opacity = String(1 - progress);
    }
  }, []);

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const sheet = sheetRef.current;
      if (!sheet) return;

      sheet.releasePointerCapture(e.pointerId);

      const currentTranslate = getCurrentTranslatePx();
      const openTranslate = vhToPx('100vh') - vhToPx(SNAP_HEIGHTS[height]);
      const dragDistance = currentTranslate - openTranslate;

      // Close threshold: 50% of peek height
      const closeThreshold = vhToPx(SNAP_HEIGHTS.peek) * CLOSE_THRESHOLD_FRACTION;

      // Re-enable transitions
      sheet.style.transition = transitionStyle;
      if (backdropRef.current) {
        backdropRef.current.style.transition = reducedMotion ? 'none' : 'opacity 0.3s ease';
      }

      if (dragDistance > closeThreshold) {
        // Dragged far enough → dismiss
        sheet.style.transform = `translateY(${CLOSED_TRANSLATE})`;
        if (backdropRef.current) backdropRef.current.style.opacity = '0';
        animating.current = true;
        setTimeout(() => {
          animating.current = false;
          onClose();
        }, animDuration);
      } else {
        // Snap back to intended height
        sheet.style.transform = sheetTranslateForHeight(height);
        if (backdropRef.current) backdropRef.current.style.opacity = '1';
        animating.current = true;
        setTimeout(() => {
          animating.current = false;
        }, animDuration);
      }
    },
    [getCurrentTranslatePx, height, onClose, reducedMotion, transitionStyle, animDuration],
  );

  // ── Backdrop click → dismiss ───────────────────────────────────────────
  const onBackdropClick = useCallback(() => {
    if (animating.current) return;
    onClose();
  }, [onClose]);

  // ── Escape key → dismiss ───────────────────────────────────────────────
  useEffect(() => {
    if (!mounted) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mounted, onClose]);

  // ── Don't render when fully closed ─────────────────────────────────────
  if (!mounted) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div
        ref={backdropRef}
        aria-hidden="true"
        onClick={onBackdropClick}
        className="fixed inset-0 bg-black/50"
        style={{
          zIndex: zIndex - 1,
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          opacity: 0,
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelId}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={cn(
          'fixed bottom-0 left-0 right-0 flex flex-col',
          'rounded-t-2xl border-t',
          'bg-[var(--color-bg-secondary)] border-[var(--color-border)]',
        )}
        style={{
          zIndex,
          maxHeight: SNAP_HEIGHTS.full,
          transform: `translateY(${CLOSED_TRANSLATE})`,
          willChange: 'transform',
        }}
      >
        {/* Drag handle */}
        {dragHandle && (
          <div
            className="flex items-center justify-center cursor-grab active:cursor-grabbing"
            style={{
              height: 24,
              touchAction: 'none',
              userSelect: 'none',
              WebkitUserSelect: 'none',
            }}
          >
            <div className="rounded-sm bg-[var(--color-border)]" style={{ width: 40, height: 4 }} />
          </div>
        )}

        {/* Scrollable content */}
        <div id={labelId} className="flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </>
  );
};
