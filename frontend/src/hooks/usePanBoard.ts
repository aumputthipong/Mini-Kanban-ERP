import { useEffect, useRef } from "react";

/**
 * Hold Space + left-click drag to pan the board horizontally.
 * Snap resumes after releasing the mouse.
 */
export function usePanBoard(containerRef: React.RefObject<HTMLElement | null>) {
  const s = useRef({ isPanMode: false, isDragging: false, startX: 0, startScrollLeft: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const enterPanMode = () => {
      s.current.isPanMode = true;
      el.classList.add("pan-mode");
    };

    const exitPanMode = () => {
      s.current.isPanMode = false;
      s.current.isDragging = false;
      el.classList.remove("pan-mode", "panning");
      el.classList.add("snap-x", "snap-mandatory");
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat || s.current.isPanMode) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      e.preventDefault();
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
      s.current.startScrollLeft = el.scrollLeft;
      el.classList.add("panning");
      // disable snap while dragging so scroll follows cursor exactly
      el.classList.remove("snap-x", "snap-mandatory");
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!s.current.isDragging) return;
      el.scrollLeft = s.current.startScrollLeft - (e.clientX - s.current.startX);
    };

    const onPointerUp = () => {
      if (!s.current.isDragging) return;
      s.current.isDragging = false;
      el.classList.remove("panning");
      // re-enable snap so it snaps to the nearest column on release
      el.classList.add("snap-x", "snap-mandatory");
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
