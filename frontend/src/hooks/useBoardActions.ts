// hooks/useBoardActions.ts
import { DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { useRef } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { API_URL, WS_URL } from "@/lib/constants";
import type { Card, Subtask } from "@/types/board";

const POSITION_GAP = 65536;

// helper ทั้งสองอาน fresh columns จาก store โดยตรง (ไม่ใช้ closure)
function resolveOverFromColumns(
  freshColumns: ReturnType<typeof useBoardStore.getState>["columns"],
  overId: string,
): { overColumnId: string; overCardId: string | null } | null {
  if (freshColumns.some((c) => c.id === overId)) {
    return { overColumnId: overId, overCardId: null };
  }
  const overCol = freshColumns.find((col) => col.cards.some((c) => c.id === overId));
  if (!overCol) return null;
  return { overColumnId: overCol.id, overCardId: overId };
}

function calcPositionFromColumns(
  freshColumns: ReturnType<typeof useBoardStore.getState>["columns"],
  overColumnId: string,
  overCardId: string | null,
  excludeCardId: string,
): number {
  const targetColumn = freshColumns.find((c) => c.id === overColumnId);
  if (!targetColumn) return POSITION_GAP;
  const sortedCards = [...targetColumn.cards]
    .filter((c) => c.id !== excludeCardId)
    .sort((a, b) => a.position - b.position);
  if (overCardId) {
    const overIdx = sortedCards.findIndex((c) => c.id === overCardId);
    const prevPos = overIdx > 0 ? sortedCards[overIdx - 1].position : 0;
    const nextPos = sortedCards[overIdx]?.position ?? prevPos + POSITION_GAP * 2;
    return (prevPos + nextPos) / 2;
  }
  const lastCard = sortedCards[sortedCards.length - 1];
  return lastCard ? lastCard.position + POSITION_GAP : POSITION_GAP;
}

export function useBoardActions(boardId: string) {
  const { columns, moveCard, updateCard } = useBoardStore();
  const { sendMessage } = useWebSocket(`${WS_URL}/${boardId}`);

  // ref ติดตาม column ที่การ์ดถูกย้ายไปล่าสุดระหว่าง drag
  // ใช้ ref แทน state เพื่อหลีกเลี่ยง React update cycle → ไม่วนลูป
  const dragOverColumnRef = useRef<string | null>(null);

  // onDragOver — ย้ายการ์ดเข้า SortableContext ของ column ปลายทาง (visual only)
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

    const currentCol = freshColumns.find((col) => col.cards.some((c) => c.id === activeCardId));
    if (!currentCol || currentCol.id === overColumnId) {
      dragOverColumnRef.current = overColumnId;
      return;
    }

    const tempPosition = calcPositionFromColumns(freshColumns, overColumnId, overCardId, activeCardId);
    dragOverColumnRef.current = overColumnId;
    useBoardStore.getState().moveCard(activeCardId, overColumnId, tempPosition);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    // reset ref ทุกครั้งที่ drag จบ
    dragOverColumnRef.current = null;

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCardId = active.id as string;
    const originalColumnId = active.data.current?.currentColumnId as string;

    const freshColumns = useBoardStore.getState().columns;
    const resolved = resolveOverFromColumns(freshColumns, over.id as string);
    if (!resolved) return;
    const { overColumnId, overCardId } = resolved;

    const newPosition = calcPositionFromColumns(freshColumns, overColumnId, overCardId, activeCardId);

    // Final optimistic update (แก้ position จาก temp เป็น final)
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

  const handleToggleDone = (card: Card) => {
    sendMessage({
      type: "CARD_DONE_TOGGLED",
      payload: {
        card_id: card.id,
        board_id: boardId,
        is_done: !card.is_done,
      },
    });
  };

  const handleAddCard = (columnId: string, title: string) => {
    // คำนวณ position = lastCard.position + GAP (ต่อท้าย column)
    const col = columns.find((c) => c.id === columnId);
    const sorted = col ? [...col.cards].sort((a, b) => a.position - b.position) : [];
    const lastCard = sorted[sorted.length - 1];
    const newPosition = lastCard ? lastCard.position + POSITION_GAP : POSITION_GAP;

    sendMessage({
      type: "CARD_CREATED",
      payload: { column_id: columnId, title, position: newPosition },
    });
  };

  const handleDeleteCard = (cardId: string) => {
    sendMessage({
      type: "CARD_DELETED",
      payload: { card_id: cardId },
    });
  };

  const handleUpdateCard = (cardId: string, form: any) => {
    updateCard({
      ...columns.flatMap((c) => c.cards).find((c) => c.id === cardId)!,
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      assignee_id: form.assignee_id || null,
      priority: (form.priority as Card["priority"]) || null,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
    });

    sendMessage({
      type: "CARD_UPDATED",
      payload: {
        card_id: cardId,
        title: form.title,
        description: form.description || null,
        due_date: form.due_date || null,
        assignee_id: form.assignee_id || null,
        priority: form.priority || null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      },
    });
  };

  const handleAddSubtask = async (cardId: string, title: string) => {
    try {
      const targetCard = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
      if (!targetCard) return;

      const currentSubtasks = targetCard.subtasks || [];
      const newPosition = currentSubtasks.length + 1;

      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, position: newPosition }),
      });

      if (!response.ok) {
        throw new Error("Failed to create subtask");
      }

      const newSubtask: Subtask = await response.json();

      updateCard({
        ...targetCard,
        subtasks: [...currentSubtasks, newSubtask],
        total_subtasks: targetCard.total_subtasks + 1,
      });

    } catch (error) {
      console.error("Error creating subtask:", error);
    }
  };

  const fetchSubtasks = async (cardId: string) => {
    try {
      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (!response.ok) throw new Error("Failed to fetch subtasks");

      const data = await response.json();
      useBoardStore.getState().setSubtasksToCard(cardId, data);

    } catch (error) {
      console.error("Error fetching subtasks:", error);
    }
  }; 

  const handleToggleSubtask = async (cardId: string, subtaskId: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;

    useBoardStore.getState().updateSubtaskInCard(cardId, subtaskId, { is_done: newStatus });

    try {
      // ✅ ใช้ API_URL
      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_done: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update subtask");
      }
    } catch (error) {
      console.error("Error updating subtask:", error);
      useBoardStore.getState().updateSubtaskInCard(cardId, subtaskId, { is_done: currentStatus });
    }
  };

  const handleDeleteSubtask = async (cardId: string, subtaskId: string) => {
    useBoardStore.getState().deleteSubtaskFromCard(cardId, subtaskId);

    try {
      // ✅ ใช้ API_URL
      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks/${subtaskId}`, {
        method: "DELETE",
        credentials: "include",


      });

      if (!response.ok) {
        throw new Error("Failed to delete subtask");
      }
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  const handleUpdateSubtaskTitle = async (cardId: string, subtaskId: string, newTitle: string) => {
    // ถ้าแก้แล้วเป็นค่าว่าง ไม่ต้องเซฟ
    if (!newTitle.trim()) return;

    // 1. Optimistic Update: เปลี่ยน UI ทันที
    useBoardStore.getState().updateSubtaskInCard(cardId, subtaskId, { title: newTitle.trim() });

    try {
      // 2. ยิง API ไปอัปเดตหลังบ้าน (ใช้ PATCH เหมือนเดิม)
      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });

      if (!response.ok) {
        throw new Error("Failed to update subtask title");
      }
    } catch (error) {
      console.error("Error updating subtask title:", error);
      // ถ้าพังก็ดึงข้อมูลมาทับใหม่
      fetchSubtasks(cardId);
    }
  };

  const handleDragStart = () => {
    dragOverColumnRef.current = null;
  };

  return {
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleAddCard,
    handleDeleteCard,
    handleUpdateCard,
    handleToggleDone,
    handleAddSubtask,
    fetchSubtasks,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleUpdateSubtaskTitle,
  };
}