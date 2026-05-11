// hooks/useCanEdit.ts
import { useBoardStore } from "@/store/useBoardStore";
import type { Card } from "@/types/board";

/**
 * Predicate for "can the current user edit this card?" — used to enable/disable
 * inline edit affordances in the card UI.
 *
 * A user can edit a card if any of:
 *   - they created it
 *   - they are the current assignee
 *   - they are an owner or manager of the board
 *
 * Mirrors what `service` would allow on the backend, but the backend remains
 * the source of truth — this just hides controls a user can't use anyway.
 */
export function useCanEdit(card: Card): boolean {
  const currentUserId = useBoardStore((s) => s.currentUserId);
  const boardMembers = useBoardStore((s) => s.boardMembers);

  if (!currentUserId) return false;

  // creator
  if (card.created_by === currentUserId) return true;

  // assignee
  if (card.assignee_id === currentUserId) return true;

  // owner or manager
  const member = boardMembers.find((m) => m.user_id === currentUserId);
  if (member && (member.role === "owner" || member.role === "manager")) return true;

  return false;
}
