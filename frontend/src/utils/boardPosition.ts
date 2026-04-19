import { useBoardStore } from "@/store/useBoardStore";

export const POSITION_GAP = 65536;

export function resolveOverFromColumns(
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

export function calcPositionFromColumns(
  freshColumns: ReturnType<typeof useBoardStore.getState>["columns"],
  overColumnId: string,
  overCardId: string | null,
  excludeCardId: string,
  placeAfter: boolean = false,
): number {
  const targetColumn = freshColumns.find((c) => c.id === overColumnId);
  if (!targetColumn) return POSITION_GAP;
  const sortedCards = [...targetColumn.cards]
    .filter((c) => c.id !== excludeCardId)
    .sort((a, b) => a.position - b.position);
  if (overCardId) {
    const overIdx = sortedCards.findIndex((c) => c.id === overCardId);
    if (overIdx === -1) {
      const last = sortedCards[sortedCards.length - 1];
      return last ? last.position + POSITION_GAP : POSITION_GAP;
    }
    if (placeAfter) {
      const prevPos = sortedCards[overIdx].position;
      const nextPos = sortedCards[overIdx + 1]?.position ?? prevPos + POSITION_GAP * 2;
      return (prevPos + nextPos) / 2;
    }
    const prevPos = overIdx > 0 ? sortedCards[overIdx - 1].position : 0;
    const nextPos = sortedCards[overIdx].position;
    return (prevPos + nextPos) / 2;
  }
  const lastCard = sortedCards[sortedCards.length - 1];
  return lastCard ? lastCard.position + POSITION_GAP : POSITION_GAP;
}
