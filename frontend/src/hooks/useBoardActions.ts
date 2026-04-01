// hooks/useBoardActions.ts
import { DragEndEvent } from "@dnd-kit/core";
import { useBoardStore } from "@/store/useBoardStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { WS_URL } from "@/lib/constants";
import type { Card } from "@/types/board";

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

  return {
    handleDragEnd,
    handleAddCard,
    handleDeleteCard,
    handleUpdateCard,
  };
}