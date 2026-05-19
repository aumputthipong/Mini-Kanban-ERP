"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  User as UserIcon,
  X,
  Check,
} from "lucide-react";
import type { Card } from "@/types/board";
import { getAvatarColor } from "@/utils/avatar";
import { getColumnColorHex } from "@/components/board/task-board/ColumnOptionsModal";
import { formatThaiDate } from "@/utils/date_helper";
import type { PillState } from "./pillState";

interface Props {
  anchorEl: HTMLElement | null;
  card: Card;
  state: PillState;
  onClose: () => void;
  onOpenCard: () => void;
}

// Per design.md `popover-card` — max-width 320px (size.popover-max),
// surface-elevated white, rounded.md, shadow-md. One button-primary
// ("Open card"); other actions are text-link in secondary slate.
export function CardPreviewPopover({
  anchorEl,
  card,
  state,
  onClose,
  onOpenCard,
}: Props) {
  const popRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!anchorEl) return;
    const rect = anchorEl.getBoundingClientRect();
    const popW = 320;
    const popH = 280; // estimate; we'll re-clamp after measuring
    const margin = 8;
    let left = rect.left;
    let top = rect.bottom + margin;
    // Flip above the anchor if there isn't room below
    if (top + popH > window.innerHeight) {
      top = Math.max(margin, rect.top - popH - margin);
    }
    // Keep within horizontal viewport
    left = Math.min(Math.max(margin, left), window.innerWidth - popW - margin);
    setPos({ top, left });
  }, [anchorEl]);

  // Close on outside click / Escape so the popover doesn't latch.
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

  if (!pos) return null;

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
      // Allow pointer to enter the popover without dismissing — TaskPill's
      // onPointerLeave already cleared isHovering, so the popover itself
      // controls its own close via outside click / Escape.
      onPointerEnter={(e) => e.stopPropagation()}
      style={{ top: pos.top, left: pos.left, width: 320 }}
      // shadow-md, rounded.md, lg padding
      className="fixed z-50 rounded-lg border border-slate-200 bg-white p-6 shadow-lg"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
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
        <button
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="text-slate-400 hover:text-slate-600"
        >
          <X size={14} />
        </button>
      </div>

      <p
        className={`mb-3 text-sm font-semibold leading-snug ${state === "done" ? "text-slate-700" : "text-slate-900"}`}
      >
        {card.title}
      </p>

      <div className="mb-3 space-y-1.5 text-xs text-slate-600">
        {dueLabel && (
          <div className="flex items-center gap-2">
            <CalendarIcon size={12} className="text-slate-400" />
            <span>
              Due {dueLabel}
              {state === "overdue" && (
                <span className="ml-1 font-semibold text-red-700">(overdue)</span>
              )}
            </span>
          </div>
        )}
        {(card.estimated_hours || acPct !== null) && (
          <div className="flex items-center gap-2">
            <Clock size={12} className="text-slate-400" />
            <span>
              {card.estimated_hours ? `Estimated ${card.estimated_hours}h` : "No estimate"}
              {acPct !== null && (
                <span className="ml-1 text-slate-500">· Progress {acPct}%</span>
              )}
            </span>
          </div>
        )}
        {card.assignee_name && card.assignee_id ? (
          <div className="flex items-center gap-2">
            <UserIcon size={12} className="text-slate-400" />
            <span className="flex items-center gap-1.5">
              Assigned to
              <span
                className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white ${getAvatarColor(card.assignee_id)}`}
              >
                {card.assignee_name.charAt(0).toUpperCase()}
              </span>
              <span className="text-slate-700">{card.assignee_name}</span>
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <UserIcon size={12} className="text-slate-400" />
            <span>Unassigned</span>
          </div>
        )}
      </div>

      {card.subtasks && card.subtasks.length > 0 && (
        <div className="mb-3 border-t border-slate-100 pt-3">
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Acceptance Criteria · {acDone}/{acTotal}
          </p>
          <ul className="space-y-1">
            {card.subtasks.slice(0, 4).map((s) => (
              <li key={s.id} className="flex items-center gap-2 text-xs">
                <span
                  className={`flex h-3.5 w-3.5 items-center justify-center rounded-sm border ${s.is_done ? "border-emerald-600 bg-emerald-600" : "border-slate-300"}`}
                >
                  {s.is_done && <Check size={9} strokeWidth={3} className="text-white" />}
                </span>
                <span
                  className={`flex-1 truncate ${s.is_done ? "text-slate-400 line-through" : "text-slate-700"}`}
                >
                  {s.title}
                </span>
              </li>
            ))}
            {card.subtasks.length > 4 && (
              <li className="text-[10px] text-slate-400">
                +{card.subtasks.length - 4} more
              </li>
            )}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
        <button
          type="button"
          onClick={onOpenCard}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Edit due
        </button>
        <button
          type="button"
          onClick={onOpenCard}
          className="text-xs font-medium text-slate-500 hover:text-slate-700"
        >
          Reassign
        </button>
        <button
          type="button"
          onClick={onOpenCard}
          // button-primary — only one per popover (design.md Do's)
          className="rounded bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900"
        >
          Open card →
        </button>
      </div>
    </div>,
    document.body,
  );
}
