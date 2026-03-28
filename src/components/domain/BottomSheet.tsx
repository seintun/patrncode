'use client';

import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type FC,
  type ReactNode,
} from 'react';
import { useBottomSheetDrag, type SheetHeight } from '@/hooks/useBottomSheetDrag';
import { cn } from '@/lib/utils';

// ── Types ────────────────────────────────────────────────────────────────────

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
  large: '95vh',
  full: '95vh',
};

/** TranslateY when sheet is fully closed (hidden below viewport). */
const CLOSED_TRANSLATE = '100%';

/**
 * Fraction of the initial snap height you must drag downward before
 * the sheet snaps closed instead of snapping back.
 */
const CLOSE_THRESHOLD_FRACTION = 0.5;

const TRANSITION =
  'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1), height 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
const ANIMATION_MS = 300;

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Resolve a vh string like "40vh" to pixel value. */
function vhToPx(vh: string): number {
  if (typeof window === 'undefined') return 0;
  return (parseFloat(vh) / 100) * window.innerHeight;
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

  /**
   * Internal mounted state. We keep the DOM alive during the close animation
   * even after `open` becomes `false`, then unmount once the transition ends.
   */
  const [currentHeight, setCurrentHeight] = useState<SheetHeight>(height);
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

  // ── Drag Logic Hook ────────────────────────────────────────────────────
  const { onPointerDown, onPointerMove, onPointerUp, animatingRef } = useBottomSheetDrag({
    currentHeight,
    setCurrentHeight,
    height,
    onClose,
    snapHeights: SNAP_HEIGHTS,
    animDuration,
    transitionStyle,
    reducedMotion,
    sheetRef,
    backdropRef,
    closeThresholdFraction: CLOSE_THRESHOLD_FRACTION,
    vhToPx,
  });

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
      if (currentHeight !== height) {
        setCurrentHeight(height);
      }

      // Start off-screen (no transition)
      sheet.style.transition = 'none';
      backdrop.style.transition = 'none';
      sheet.style.transform = `translateY(${CLOSED_TRANSLATE})`;
      backdrop.style.opacity = '0';
      sheet.style.height = SNAP_HEIGHTS[currentHeight];

      // Force reflow so the browser registers the starting position
      void sheet.offsetHeight;

      // Animate in
      sheet.style.transition = transitionStyle;
      backdrop.style.transition = reducedMotion ? 'none' : 'opacity 0.3s ease';
      sheet.style.transform = 'translateY(0px)';
      backdrop.style.opacity = '1';
    } else if (mounted) {
      // ── Closing (only animate out if we were visible) ──
      sheet.style.transition = transitionStyle;
      backdrop.style.transition = reducedMotion ? 'none' : 'opacity 0.3s ease';
      sheet.style.transform = `translateY(${CLOSED_TRANSLATE})`;
      backdrop.style.opacity = '0';

      animatingRef.current = true;
      closeTimerRef.current = setTimeout(() => {
        animatingRef.current = false;
        setMounted(false);
      }, animDuration);
    }
  }, [
    open,
    height,
    currentHeight,
    transitionStyle,
    reducedMotion,
    animDuration,
    mounted,
    onClose,
    animatingRef,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // ── Backdrop click → dismiss ───────────────────────────────────────────
  const onBackdropClick = useCallback(() => {
    if (animatingRef.current) return;
    onClose();
  }, [onClose, animatingRef]);

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
          height: SNAP_HEIGHTS[currentHeight],
          maxHeight: SNAP_HEIGHTS.full,
          transform: `translateY(${CLOSED_TRANSLATE})`,
          willChange: 'transform, height',
        }}
      >
        {/* Drag handle */}
        {dragHandle && (
          <div
            data-bottomsheet-drag="true"
            className="flex items-center justify-center cursor-grab active:cursor-grabbing w-full"
            style={{
              height: 32,
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
