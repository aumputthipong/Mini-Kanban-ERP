import { useEffect, useRef } from "react";

function getScrollParent(el: HTMLElement): HTMLElement {
  let node: HTMLElement | null = el.parentElement;
  while (node) {
    const style = getComputedStyle(node);
    const overflow = style.overflow + style.overflowX;
    if (/auto|scroll/.test(overflow)) return node;
    node = node.parentElement;
  }
  return document.documentElement as HTMLElement;
}

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
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
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
      const scrollEl = getScrollParent(el);
      s.current.isDragging = true;
      s.current.startX = e.clientX;
      s.current.startScrollLeft = scrollEl.scrollLeft;
      el.classList.add("panning");
      el.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!s.current.isDragging) return;
      const scrollEl = getScrollParent(el);
      scrollEl.scrollLeft = s.current.startScrollLeft - (e.clientX - s.current.startX);
    };

    const onPointerUp = () => {
      if (!s.current.isDragging) return;
      s.current.isDragging = false;
      el.classList.remove("panning");
    };

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
