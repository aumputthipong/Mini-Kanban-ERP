// hooks/useBoardActions.ts
import { DragEndEvent } from "@dnd-kit/core";
import { useBoardStore } from "@/store/useBoardStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { API_URL, WS_URL } from "@/lib/constants";
import type { Card, Subtask } from "@/types/board";

export function useBoardActions(boardId: string) {
  const { columns, moveCard, updateCard } = useBoardStore();
  const { sendMessage } = useWebSocket(`${WS_URL}/${boardId}`);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const newColumnId = over.id as string;
    const oldColumnId = active.data.current?.currentColumnId;

    if (!oldColumnId || newColumnId === oldColumnId) return;

    moveCard(cardId, oldColumnId, newColumnId);

    const targetColumn = columns.find((c) => c.id === newColumnId);
    const newPosition = targetColumn ? targetColumn.cards.length + 1 : 1;

    sendMessage({
      type: "CARD_MOVED",
      payload: {
        card_id: cardId,
        old_column_id: oldColumnId,
        new_column_id: newColumnId,
        position: newPosition,
      },
    });
  };

  const handleAddCard = (columnId: string, title: string) => {
    sendMessage({
      type: "CARD_CREATED",
      payload: { column_id: columnId, title },
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
      // 1. หาตำแหน่ง Position ล่าสุดของ Subtask ในการ์ดนี้ (Best Practice)
      const targetCard = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
      if (!targetCard) return;

      const currentSubtasks = targetCard.subtasks || [];
      const newPosition = currentSubtasks.length + 1;
      // 2. ยิง HTTP POST ไปยัง API ที่เราเพิ่งสร้าง
      const response = await fetch(`${API_URL}/api/cards/${cardId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, position: newPosition }),
      });

      console.log(response)
      if (!response.ok) {
        throw new Error("Failed to create subtask");
      }

      // 3. รับข้อมูล Subtask ที่เพิ่งบันทึกลง Database กลับมา
      const newSubtask: Subtask = await response.json();

      // 4. อัปเดต Store เพื่อให้ UI เปลี่ยนแปลงทันที
      updateCard({
        ...targetCard,
        subtasks: [...currentSubtasks, newSubtask],
      });

    } catch (error) {
      console.error("Error creating subtask:", error);
      // ตรงนี้อาจจะเพิ่ม Toast Notification แจ้งเตือนผู้ใช้ในอนาคตได้
    }
  };

  return {
    handleDragEnd,
    handleAddCard,
    handleDeleteCard,
    handleUpdateCard,
    handleAddSubtask,
  };
}