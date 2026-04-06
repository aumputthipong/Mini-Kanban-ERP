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

    moveCard(cardId, newColumnId);

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

  return {
    handleDragEnd,
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