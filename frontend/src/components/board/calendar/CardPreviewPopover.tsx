"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  Check,
} from "lucide-react";
import type { Card } from "@/types/board";
import { useBoardActions } from "@/hooks/useBoardActions";
import { useCanEdit } from "@/hooks/useCanEdit";
import { getAvatarColor } from "@/utils/avatar";
import { getColumnColorHex } from "@/components/board/task-board/ColumnOptionsModal";
import { formatThaiDate } from "@/utils/date_helper";
import type { PillState } from "./pillState";

interface Props {
  anchorEl: HTMLElement | null;
  card: Card;
  state: PillState;
  boardId: string;
  onClose: () => void;
  onOpenCard: () => void;
  /** Pointer entered the popover — parent cancels its close timer. */
  onPointerEnter?: () => void;
  /** Pointer left the popover — parent starts its close timer. */
  onPointerLeave?: () => void;
}

// Per design.md `popover-card` — max-width 320px (size.popover-max),
// surface-elevated white, rounded.md, shadow-md. The popover is a
// preview surface: it displays the card's key fields and offers a
// single primary action — "Edit details →" — which escalates to the
// full CardDetailModal for any change. Inline edits were removed
// intentionally; the popover stays a calm preview, not a mini editor.
export function CardPreviewPopover({
  anchorEl,
  card,
  state,
  boardId,
  onClose,
  onOpenCard,
  onPointerEnter,
  onPointerLeave,
}: Props) {
  const popRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const { handleToggleSubtask } = useBoardActions(boardId);
  const canEdit = useCanEdit(card);

  // Recomputes popover position from the *current* size of the popover —
  // not a hardcoded estimate. The popover changes height when AC items
  // are ticked, so positioning needs to re-run when the popover's own
  // ResizeObserver fires.
  //
  // Vertical: prefer below; flip above when the bottom would clip off-screen
  // and above actually has room. Horizontal: prefer left-edge-aligned with
  // anchor; flip to right-edge-aligned when that would clip; clamp last.
  //
  // Note: not called synchronously inside any effect body — only from the
  // ResizeObserver callback and the window resize listener. React 19's
  // react-hooks/set-state-in-effect rule flags direct setState in effect
  // bodies; routing through subscriptions is the recommended pattern.
  const recompute = useCallback(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const popEl = popRef.current;
    const popW = popEl?.offsetWidth || 320;
    const popH = popEl?.offsetHeight || 280;
    const margin = 8;

    let top = rect.bottom + margin;
    if (top + popH > window.innerHeight - margin) {
      const aboveTop = rect.top - popH - margin;
      top = aboveTop >= margin
        ? aboveTop
        : Math.max(margin, window.innerHeight - popH - margin);
    }

    let left = rect.left;
    if (left + popW > window.innerWidth - margin) {
      const rightAligned = rect.right - popW;
      left = rightAligned >= margin
        ? rightAligned
        : Math.max(margin, window.innerWidth - popW - margin);
    }

    setPos({ top, left });
  }, [anchorEl]);

  useEffect(() => {
    if (!popRef.current) return;
    const el = popRef.current;
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [recompute]);

  // Close on outside click / Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (popRef.current?.contains(e.target as Node)) return;
      if (anchorEl?.contains(e.target as Node)) return;
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [anchorEl, onClose]);

  const dueLabel = card.due_date ? formatThaiDate(card.due_date) : null;
  const acDone = card.completed_subtasks ?? 0;
  const acTotal = card.total_subtasks ?? 0;
  const acPct = acTotal > 0 ? Math.round((acDone / acTotal) * 100) : null;

  // Priority chip colors mirror priority.* tokens in design.md.
  const priorityChip: Record<string, string> = {
    high: "bg-red-600 text-white",
    medium: "bg-amber-500 text-white",
    low: "bg-emerald-500 text-white",
  };

  return createPortal(
    <div
      ref={popRef}
      role="dialog"
      aria-label={`Preview: ${card.title}`}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      style={{
        top: pos?.top ?? 0,
        left: pos?.left ?? 0,
        width: 320,
        visibility: pos ? "visible" : "hidden",
      }}
      className="fixed z-50 rounded-lg border border-slate-200 bg-white p-6 shadow-lg"
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {card.priority && (
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${priorityChip[card.priority] ?? ""}`}
          >
            {card.priority}
          </span>
        )}
        {card.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700"
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: getColumnColorHex(tag.color) ?? "#94a3b8" }}
            />
            {tag.name}
          </span>
        ))}
      </div>

      <p
        className={`mb-3 text-sm font-semibold leading-snug ${state === "done" ? "text-slate-700" : "text-slate-900"}`}
      >
        {card.title}
      </p>

      {/* Due row — display only. Edits go through "Edit details →". */}
      <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-600">
        <CalendarIcon size={12} className="text-slate-400 shrink-0" />
        <span className="flex-1">
          {dueLabel ? (
            <>
              Due {dueLabel}
              {state === "overdue" && (
                <span className="ml-1 font-semibold text-red-700">(overdue)</span>
              )}
            </>
          ) : (
            <span className="text-slate-400 italic">No due date</span>
          )}
        </span>
      </div>

      {(card.estimated_hours || acPct !== null) && (
        <div className="mb-1.5 flex items-center gap-2 text-xs text-slate-600">
          <Clock size={12} className="text-slate-400 shrink-0" />
          <span>
            {card.estimated_hours ? `Estimated ${card.estimated_hours}h` : "No estimate"}
            {acPct !== null && (
              <span className="ml-1 text-slate-500">· Progress {acPct}%</span>
            )}
          </span>
        </div>
      )}

      {/* Assignee row — display only. Reassign goes through "Edit details →". */}
      <div className="mb-3 flex items-center gap-2 text-xs text-slate-600">
        <UserIcon size={12} className="text-slate-400 shrink-0" />
        <span className="flex-1 flex items-center gap-1.5">
          {card.assignee_name && card.assignee_id ? (
            <>
              <span
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white ${getAvatarColor(card.assignee_id)}`}
              >
                {card.assignee_name.charAt(0).toUpperCase()}
              </span>
              <span className="text-slate-700">{card.assignee_name}</span>
            </>
          ) : (
            <span className="text-slate-400 italic">Unassigned</span>
          )}
        </span>
      </div>

      {/* AC checklist — tickable directly. Clicking toggles is_done
          (handleToggleSubtask is already optimistic + reverts on API fail).
          Kept because it's a single-tap micro-action that doesn't require
          a full editor — distinct from the multi-field edits that now live
          in the modal. */}
      {card.subtasks && card.subtasks.length > 0 && (
        <div className="mb-3 border-t border-slate-100 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Acceptance Criteria · {acDone}/{acTotal}
          </p>
          <ul className="space-y-1">
            {card.subtasks.slice(0, 4).map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => canEdit && handleToggleSubtask(card.id, s.id, s.is_done)}
                  disabled={!canEdit}
                  className={`flex w-full items-center gap-2 rounded px-1 py-0.5 text-left text-xs ${canEdit ? "hover:bg-slate-50" : ""} disabled:cursor-not-allowed`}
                >
                  <span
                    className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border ${s.is_done ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`}
                  >
                    {s.is_done && <Check size={9} strokeWidth={3} className="text-white" />}
                  </span>
                  <span
                    className={`flex-1 truncate ${s.is_done ? "text-slate-400 line-through" : "text-slate-700"}`}
                  >
                    {s.title}
                  </span>
                </button>
              </li>
            ))}
            {card.subtasks.length > 4 && (
              <li className="px-1 text-[10px] text-slate-400">
                +{card.subtasks.length - 4} more — open card to see all
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-end border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onOpenCard}
          // button-primary — only one per popover (design.md Do's). Sole
          // action: "Edit details →" opens the full modal for any change
          // to due date, assignee, priority, title, description, tags.
          className="rounded bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900"
        >
          Edit details →
        </button>
      </div>
    </div>,
    document.body,
  );
}
