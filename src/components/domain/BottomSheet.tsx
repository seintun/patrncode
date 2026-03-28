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

type SheetHeight = 'peek' | 'half' | 'large' | 'full';

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

  // Drag state (refs — no re-renders during drag)
  const pointerStartY = useRef(0);
  const isDragging = useRef(false);
  const animating = useRef(false);

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

      animating.current = true;
      closeTimerRef.current = setTimeout(() => {
        animating.current = false;
        setMounted(false);
      }, animDuration);
    }
  }, [open, height, currentHeight, transitionStyle, reducedMotion, animDuration, mounted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  // ── Read current translateY from computed style ────────────────────────

  const dragStartHeightPx = useRef(0);
  const dragMaxHeightPx = useRef(0);

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const target = e.target as HTMLElement | null;
      if (!target || !target.closest('[data-bottomsheet-drag="true"]')) {
        return;
      }

      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (animating.current) return;
      const sheet = sheetRef.current;
      if (!sheet) return;

      isDragging.current = true;
      pointerStartY.current = e.clientY;

      const currentH = vhToPx(SNAP_HEIGHTS[currentHeight]);
      const maxH = vhToPx(SNAP_HEIGHTS.full);
      dragStartHeightPx.current = currentH;
      dragMaxHeightPx.current = maxH;

      // Prepare for transform-only drag:
      // 1. Set height to max potential (to avoid layout changes later)
      // 2. Set translateY to hide the extra height
      sheet.style.transition = 'none';
      sheet.style.height = `${maxH}px`;
      sheet.style.transform = `translateY(${maxH - currentH}px)`;

      if (backdropRef.current) {
        backdropRef.current.style.transition = 'none';
      }

      const dragTarget = e.currentTarget as HTMLDivElement;
      dragTarget.setPointerCapture(e.pointerId);
    },
    [currentHeight],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      const sheet = sheetRef.current;
      if (!sheet) return;

      const deltaY = pointerStartY.current - e.clientY; // positive = dragging up
      const targetHeight = dragStartHeightPx.current + deltaY;

      // Clamp
      const clampedHeight = Math.max(0, Math.min(targetHeight, dragMaxHeightPx.current));
      const translatePx = dragMaxHeightPx.current - clampedHeight;

      sheet.style.transform = `translateY(${translatePx}px)`;

      if (backdropRef.current) {
        const baseH = vhToPx(SNAP_HEIGHTS[height]);
        const progress = Math.min(Math.max(clampedHeight / baseH, 0), 1);
        backdropRef.current.style.opacity = String(progress);
      }
    },
    [height],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!isDragging.current) return;
      isDragging.current = false;

      const sheet = sheetRef.current;
      if (!sheet) return;

      const dragTarget = e.currentTarget as HTMLDivElement;
      dragTarget.releasePointerCapture(e.pointerId);

      const deltaY = pointerStartY.current - e.clientY;
      const endHeight = dragStartHeightPx.current + deltaY;

      const baseH = vhToPx(SNAP_HEIGHTS[height]);
      const fullH = vhToPx(SNAP_HEIGHTS.full);

      sheet.style.transition = transitionStyle;
      if (backdropRef.current) {
        backdropRef.current.style.transition = reducedMotion ? 'none' : 'opacity 0.3s ease';
      }

      // Snap logic
      if (endHeight < baseH - baseH * CLOSE_THRESHOLD_FRACTION) {
        // Close
        sheet.style.transform = `translateY(${dragMaxHeightPx.current}px)`;
        if (backdropRef.current) backdropRef.current.style.opacity = '0';
        animating.current = true;
        setTimeout(() => {
          animating.current = false;
          onClose();
        }, animDuration);
      } else if (endHeight > baseH + (fullH - baseH) * 0.25) {
        // Expand to full
        setCurrentHeight('full');
        sheet.style.transform = `translateY(0px)`;
        if (backdropRef.current) backdropRef.current.style.opacity = '1';
        animating.current = true;
        setTimeout(() => {
          animating.current = false;
          sheet.style.height = SNAP_HEIGHTS.full;
        }, animDuration);
      } else {
        // Snap back to base
        setCurrentHeight(height);
        const targetTranslate = dragMaxHeightPx.current - baseH;
        sheet.style.transform = `translateY(${targetTranslate}px)`;
        if (backdropRef.current) backdropRef.current.style.opacity = '1';
        animating.current = true;
        setTimeout(() => {
          animating.current = false;
          sheet.style.height = SNAP_HEIGHTS[height];
          sheet.style.transform = 'translateY(0px)';
        }, animDuration);
      }
    },
    [height, onClose, reducedMotion, transitionStyle, animDuration],
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
