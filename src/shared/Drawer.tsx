import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { type FC, type ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useIsTablet } from "@/hooks/useMediaQuery";
import { classes } from "@/styles/utils";
import styles from "./Drawer.module.scss";

const EASING = "cubic-bezier(0.32, 0.72, 0, 1)";
// Pulled down this share of its height, or flicked faster than this many px/ms, it closes
const CLOSE_DISTANCE = 0.25;
const CLOSE_VELOCITY = 0.4;

const duration = (ms: number) => (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : ms);

// Text fields keep their own touch gestures, like moving the caret
const isTextField = (target: EventTarget | null) =>
  target instanceof Element && Boolean(target.closest("input, textarea, [contenteditable]"));

// Pulling down a scrolled list scrolls it back instead of closing
const isScrolled = (target: EventTarget | null, panel: HTMLElement) => {
  for (let el = target instanceof Element ? target : null; el && panel.contains(el); el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
};

type OwnProps = {
  title?: ReactNode;
  /** Secondary buttons shown beside the title */
  titleActions?: ReactNode;
  className?: string;
  /** Called after it animates out, use Headless UI's CloseButton or useClose inside to close it animated */
  onClose: () => void;
  children: ReactNode;
};

/** A bottom sheet that can be pulled down on narrow screens and a dialog on wider ones */
const Drawer: FC<OwnProps> = ({ title, titleActions, className, onClose, children }) => {
  const isSheet = useIsTablet();
  // Headless UI mounts the panel a render later, so the effects get it from state
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  const [backdrop, setBackdrop] = useState<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const attachPanel = useCallback((element: HTMLDivElement | null) => {
    panelRef.current = element;
    setPanel(element);
  }, []);
  const closing = useRef(false);
  const onCloseRef = useRef(onClose);
  const hidden = isSheet ? "translate3d(0, 100%, 0)" : "scale(0.96)";

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  // biome-ignore lint/correctness/useExhaustiveDependencies: animates in once, when it appears
  useLayoutEffect(() => {
    const options = { duration: duration(isSheet ? 400 : 180), easing: EASING };
    panel?.animate({ transform: [hidden, "none"], opacity: isSheet ? [1, 1] : [0, 1] }, options);
    backdrop?.animate({ opacity: [0, 1] }, options);
  }, [panel, backdrop]);

  // Starts from wherever a drag or the opening left it
  const close = useCallback(() => {
    if (!panel || !backdrop) return onCloseRef.current();
    if (closing.current) return;
    closing.current = true;
    const options = { duration: duration(isSheet ? 300 : 140), easing: EASING, fill: "forwards" as const };
    const { transform, opacity } = getComputedStyle(panel);
    Promise.all([
      panel.animate({ transform: [transform, hidden], opacity: [opacity, isSheet ? opacity : "0"] }, options).finished,
      backdrop.animate({ opacity: [getComputedStyle(backdrop).opacity, "0"] }, options).finished,
    ]).then(() => onCloseRef.current(), console.error);
  }, [panel, backdrop, isSheet, hidden]);

  useEffect(() => {
    if (!isSheet || !panel || !backdrop) return;
    let start: { x: number; y: number; time: number } | undefined;
    let offset = 0;
    let dragging = false;

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      dragging = false;
      start =
        touch && event.touches.length === 1 && !isTextField(event.target)
          ? { x: touch.clientX, y: touch.clientY, time: event.timeStamp }
          : undefined;
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!start || !touch || closing.current) return;
      const dy = touch.clientY - start.y;
      if (!dragging) {
        // Only pulling down from the top of the content drags, anything else scrolls it
        if (dy <= 0 || Math.abs(touch.clientX - start.x) > dy || isScrolled(event.target, panel)) {
          start = undefined;
          return;
        }
        dragging = true;
        for (const animation of panel.getAnimations()) animation.cancel();
      }
      event.preventDefault();
      offset = Math.max(dy, 0);
      panel.style.transform = `translate3d(0, ${offset}px, 0)`;
      backdrop.style.opacity = String(1 - offset / panel.offsetHeight);
    };

    const onTouchEnd = (event: TouchEvent) => {
      if (!dragging || !start) return;
      const velocity = offset / (event.timeStamp - start.time);
      dragging = false;
      start = undefined;
      if (offset > panel.offsetHeight * CLOSE_DISTANCE || velocity > CLOSE_VELOCITY) return close();
      const options = { duration: duration(400), easing: EASING };
      panel.animate({ transform: [panel.style.transform, "none"] }, options);
      backdrop.animate({ opacity: [backdrop.style.opacity, "1"] }, options);
      panel.style.transform = "";
      backdrop.style.opacity = "";
    };

    // The keyboard covers the bottom of the layout viewport, so the sheet moves above it
    const viewport = window.visualViewport;
    const onViewportChange = () => {
      if (!viewport) return;
      const keyboard = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      panel.style.setProperty("--keyboard-inset", `${keyboard}px`);
    };

    panel.addEventListener("touchstart", onTouchStart, { passive: true });
    panel.addEventListener("touchmove", onTouchMove, { passive: false });
    panel.addEventListener("touchend", onTouchEnd);
    panel.addEventListener("touchcancel", onTouchEnd);
    viewport?.addEventListener("resize", onViewportChange);
    viewport?.addEventListener("scroll", onViewportChange);
    return () => {
      panel.removeEventListener("touchstart", onTouchStart);
      panel.removeEventListener("touchmove", onTouchMove);
      panel.removeEventListener("touchend", onTouchEnd);
      panel.removeEventListener("touchcancel", onTouchEnd);
      viewport?.removeEventListener("resize", onViewportChange);
      viewport?.removeEventListener("scroll", onViewportChange);
    };
  }, [isSheet, panel, backdrop, close]);

  return (
    // A sheet focuses itself instead of its first field, so opening it doesn't pop up the keyboard
    <Dialog open onClose={close} initialFocus={isSheet ? panelRef : undefined}>
      <div ref={setBackdrop} className={styles.backdrop} aria-hidden="true" />
      <div className={classes(styles.container, isSheet && styles.sheet)}>
        <DialogPanel ref={attachPanel} tabIndex={-1} className={classes(styles.panel, className)}>
          {isSheet && <div className={styles.handle} aria-hidden="true" />}
          {title && (
            <div className={styles.header}>
              <DialogTitle className={styles.title}>{title}</DialogTitle>
              {titleActions}
            </div>
          )}
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default Drawer;
