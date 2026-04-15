import { useEffect, useRef } from "react";

/**
 * Hold Space + left-click drag to pan the board horizontally.
 * - Snap and smooth-scroll are disabled for the entire pan mode session.
 * - Releasing the mouse does NOT snap to a column — the board stays where you left it.
 * - Snap and smooth-scroll are restored only when Space is released.
 */
export function usePanBoard(containerRef: React.RefObject<HTMLElement | null>) {
  const s = useRef({ isPanMode: false, isDragging: false, startX: 0, startY: 0, startScrollLeft: 0, startScrollTop: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const enterPanMode = () => {
      s.current.isPanMode = true;
      el.classList.add("pan-mode");
      // disable snap + smooth so panning follows the cursor exactly
      el.classList.remove("snap-x", "snap-mandatory", "scroll-smooth");
    };

    const exitPanMode = () => {
      s.current.isPanMode = false;
      s.current.isDragging = false;
      el.classList.remove("pan-mode", "panning");
      // restore snap + smooth only when leaving pan mode (spacebar release)
      el.classList.add("snap-x", "snap-mandatory", "scroll-smooth");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      // prevent default page scroll for every space keydown (including held/repeat)
      e.preventDefault();
      if (e.repeat || s.current.isPanMode) return;
      enterPanMode();
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") exitPanMode();
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!s.current.isPanMode || e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      s.current.isDragging = true;
      s.current.startX = e.clientX;
      s.current.startY = e.clientY;
      s.current.startScrollLeft = el.scrollLeft;
      s.current.startScrollTop = el.scrollTop;
      el.classList.add("panning");
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!s.current.isDragging) return;
      el.scrollLeft = s.current.startScrollLeft - (e.clientX - s.current.startX);
      el.scrollTop  = s.current.startScrollTop  - (e.clientY - s.current.startY);
    };

    const onPointerUp = () => {
      if (!s.current.isDragging) return;
      s.current.isDragging = false;
      el.classList.remove("panning");
      // intentionally NOT re-adding snap here — board stays where you left it
    };

    // reset if window loses focus while space is held
    const onBlur = () => exitPanMode();

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [containerRef]);
}
