// hooks/useCanEdit.ts
import { useBoardStore } from "@/store/useBoardStore";
import type { Card } from "@/types/board";

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
