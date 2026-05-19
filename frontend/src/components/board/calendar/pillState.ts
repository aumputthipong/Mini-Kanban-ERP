import type { Card } from "@/types/board";

export type PillState = "todo" | "inProgress" | "done" | "overdue";

/**
 * Map a card to one of four visual states for the calendar pill.
 *
 * Order matters:
 *   1. done — completed work, regardless of date. A done card past its due
 *      date is not "overdue" (the work shipped, just late). It still reads as
 *      done so users don't get red noise on their backlog.
 *   2. overdue — has a due_date strictly before today and is not done.
 *   3. inProgress — has at least one completed subtask but is not yet done.
 *   4. todo — everything else.
 *
 * Today (due_date == today) is intentionally "todo" not "overdue" — the day
 * is still in progress for the user; we don't want to scare them at 09:00.
 */
export function classifyPillState(card: Card): PillState {
  if (card.is_done) return "done";

  if (card.due_date) {
    const dueStart = new Date(card.due_date).setHours(0, 0, 0, 0);
    const todayStart = new Date().setHours(0, 0, 0, 0);
    if (dueStart < todayStart) return "overdue";
  }

  if (card.total_subtasks > 0 && card.completed_subtasks > 0) {
    return "inProgress";
  }

  return "todo";
}
