import { useBoardStore } from "@/store/useBoardStore";
import { useBoardWebSocket } from "@/contexts/BoardWebSocketContext";
import { POSITION_GAP } from "@/utils/boardPosition";
import { API_URL } from "@/lib/constants";
import type { Card, CardUpdateForm } from "@/types/board";

export function useCardActions(boardId: string) {
  const { columns, updateCard } = useBoardStore();
  const { sendMessage } = useBoardWebSocket();

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
    const col = columns.find((c) => c.id === columnId);
    const sorted = col ? [...col.cards].sort((a, b) => a.position - b.position) : [];
    const lastCard = sorted[sorted.length - 1];
    const newPosition = lastCard ? lastCard.position + POSITION_GAP : POSITION_GAP;

    sendMessage({
      type: "CARD_CREATED",
      payload: { column_id: columnId, title, position: newPosition },
    });
  };

  const handleChangeColumn = (cardId: string, toColumnId: string) => {
    const freshColumns = useBoardStore.getState().columns;
    const currentCol = freshColumns.find((col) =>
      col.cards.some((c) => c.id === cardId),
    );
    if (!currentCol || currentCol.id === toColumnId) return;

    const targetCol = freshColumns.find((c) => c.id === toColumnId);
    if (!targetCol) return;

    const sorted = [...targetCol.cards].sort((a, b) => a.position - b.position);
    const last = sorted[sorted.length - 1];
    const newPosition = last ? last.position + POSITION_GAP : POSITION_GAP;

    useBoardStore.getState().moveCard(cardId, toColumnId, newPosition);

    sendMessage({
      type: "CARD_MOVED",
      payload: {
        card_id: cardId,
        old_column_id: currentCol.id,
        new_column_id: toColumnId,
        position: newPosition,
      },
    });
  };

  const handleDeleteCard = (cardId: string) => {
    sendMessage({
      type: "CARD_DELETED",
      payload: { card_id: cardId },
    });
  };

  const handleUpdateCard = (cardId: string, form: CardUpdateForm) => {
    const { boardMembers } = useBoardStore.getState();
    const newAssigneeId = form.assignee_id || null;
    const newAssigneeName = newAssigneeId
      ? (boardMembers.find((m) => m.user_id === newAssigneeId)?.full_name ?? null)
      : null;

    // Optimistic store update (includes tags)
    updateCard({
      ...columns.flatMap((c) => c.cards).find((c) => c.id === cardId)!,
      title: form.title,
      description: form.description || null,
      due_date: form.due_date || null,
      assignee_id: newAssigneeId,
      assignee_name: newAssigneeName,
      priority: (form.priority as Card["priority"]) || null,
      estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      tags: form.tags,
    });

    // Persist via REST (handles tag_ids through service layer)
    fetch(`${API_URL}/cards/${cardId}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: form.title,
        description: form.description || null,
        due_date: form.due_date || null,
        assignee_id: newAssigneeId,
        priority: form.priority || null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
        tag_ids: form.tags.map((t) => t.id),
      }),
    }).catch(() => {});

    // Broadcast to other clients via WebSocket (non-tag fields)
    sendMessage({
      type: "CARD_UPDATED",
      payload: {
        card_id: cardId,
        title: form.title,
        description: form.description || null,
        due_date: form.due_date || null,
        assignee_id: newAssigneeId,
        assignee_name: newAssigneeName,
        priority: form.priority || null,
        estimated_hours: form.estimated_hours ? parseFloat(form.estimated_hours) : null,
      },
    });
  };

  return { handleToggleDone, handleAddCard, handleChangeColumn, handleDeleteCard, handleUpdateCard };
}
