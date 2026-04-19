import { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { useRef } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardWebSocket } from "@/contexts/BoardWebSocketContext";
import {
  POSITION_GAP,
  resolveOverFromColumns,
  calcPositionFromColumns,
} from "@/utils/boardPosition";

export function useDragActions() {
  const { moveCard } = useBoardStore();
  const { sendMessage } = useBoardWebSocket();

  // ref ติดตาม column ที่การ์ดถูกย้ายไปล่าสุดระหว่าง drag
  // ใช้ ref แทน state เพื่อหลีกเลี่ยง React update cycle → ไม่วนลูป
  const dragOverColumnRef = useRef<string | null>(null);

  const handleDragStart = () => {
    dragOverColumnRef.current = null;
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCardId = active.id as string;
    const freshColumns = useBoardStore.getState().columns;

    const resolved = resolveOverFromColumns(freshColumns, over.id as string);
    if (!resolved) return;
    const { overColumnId, overCardId } = resolved;

    // ref guard: ถ้าเราย้ายไป column นี้แล้ว ข้ามได้เลย (ป้องกัน loop)
    if (dragOverColumnRef.current === overColumnId) return;

    const currentCol = freshColumns.find((col) =>
      col.cards.some((c) => c.id === activeCardId),
    );
    if (!currentCol || currentCol.id === overColumnId) {
      dragOverColumnRef.current = overColumnId;
      return;
    }

    const tempPosition = calcPositionFromColumns(
      freshColumns,
      overColumnId,
      overCardId,
      activeCardId,
    );
    dragOverColumnRef.current = overColumnId;
    useBoardStore.getState().moveCard(activeCardId, overColumnId, tempPosition);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    dragOverColumnRef.current = null;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCardId = active.id as string;
    const originalColumnId = active.data.current?.currentColumnId as string;

    const freshColumns = useBoardStore.getState().columns;
    const resolved = resolveOverFromColumns(freshColumns, over.id as string);
    if (!resolved) return;
    const { overColumnId, overCardId } = resolved;

    // Determine whether to place BEFORE or AFTER the over card.
    // Compare translated center of the dragged card vs center of the over card —
    // if the drag is past the midpoint, treat it as "after". Handles both
    // same-column downward moves and cross-column drops onto a bottom card.
    let placeAfter = false;
    const activeTranslated = active.rect.current.translated;
    if (overCardId && over.rect && activeTranslated) {
      const overMidY = over.rect.top + over.rect.height / 2;
      const activeMidY = activeTranslated.top + activeTranslated.height / 2;
      placeAfter = activeMidY > overMidY;
    }

    const newPosition = calcPositionFromColumns(
      freshColumns,
      overColumnId,
      overCardId,
      activeCardId,
      placeAfter,
    );

    moveCard(activeCardId, overColumnId, newPosition);

    sendMessage({
      type: "CARD_MOVED",
      payload: {
        card_id: activeCardId,
        old_column_id: originalColumnId,
        new_column_id: overColumnId,
        position: newPosition,
      },
    });
  };

  // Re-export POSITION_GAP so useCardActions can use it without re-importing
  return { handleDragStart, handleDragOver, handleDragEnd, POSITION_GAP };
}
