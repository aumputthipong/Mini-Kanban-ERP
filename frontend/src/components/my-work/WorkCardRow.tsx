"use client";

import Link from "next/link";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import { PriorityBadge } from "@/components/board/task-board/PriorityBadge";
import { formatRelativeDueDate, formatThaiDate } from "@/utils/date_helper";
import type { MyWorkCard, MyWorkGroup } from "@/types/myWork";
import { SnoozeMenu } from "./SnoozeMenu";

interface WorkCardRowProps {
  card: MyWorkCard;
  onComplete: (cardId: string) => void;
  onSnooze: (cardId: string, dueDate: string) => void;
}

function dueTone(group: MyWorkGroup): string {
  switch (group) {
    case "overdue":
      return "text-rose-600 font-semibold";
    case "today":
      return "text-amber-600 font-semibold";
    case "this_week":
      return "text-slate-700";
    default:
      return "text-slate-500";
  }
}

export function WorkCardRow({ card, onComplete, onSnooze }: WorkCardRowProps) {
  const handleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onComplete(card.id);
  };

  return (
    <Link
      href={`/board/${card.board_id}/tasks`}
      className="group relative flex items-center gap-3 py-2 pl-3 pr-2 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors"
    >
      {card.priority && (
        <span
          aria-hidden
          className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${
            card.priority === "high"
              ? "bg-rose-400"
              : card.priority === "medium"
                ? "bg-amber-400"
                : "bg-emerald-400"
          }`}
        />
      )}

      <button
        type="button"
        onClick={handleComplete}
        className="w-5 h-5 shrink-0 rounded border border-slate-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
        aria-label="ทำเครื่องหมายว่าเสร็จแล้ว"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-800 truncate">
            {card.title}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-md whitespace-nowrap">
            {card.board_name}
          </span>
          {card.column_name && (
            <span className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium whitespace-nowrap">
              <span className="text-slate-300">·</span>
              <span
                aria-hidden
                className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                  card.status === "in_progress" ? "bg-amber-500" : "bg-slate-400"
                }`}
              />
              <span className="truncate max-w-30">{card.column_name}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {card.priority && <PriorityBadge priority={card.priority} />}

        {card.due_date && (
          <div
            className={`flex items-center gap-1 text-xs ${dueTone(card.group)}`}
            title={formatThaiDate(card.due_date)}
          >
            <Calendar size={12} />
            <span>{formatRelativeDueDate(card.due_date)}</span>
          </div>
        )}

        {card.estimated_hours != null && (
          <div className="flex items-center gap-1 text-xs font-medium text-slate-400 w-12 justify-end">
            <Clock size={12} />
            <span>{card.estimated_hours}h</span>
          </div>
        )}

        <SnoozeMenu onSnooze={(dueDate) => onSnooze(card.id, dueDate)} />

        <ChevronRight
          size={14}
          className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </Link>
  );
}
