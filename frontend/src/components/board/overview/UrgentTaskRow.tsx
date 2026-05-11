"use client";

import { Clock } from "lucide-react";
import type { Card } from "@/types/board";
import { PriorityBadge } from "@/components/board/task-board/PriorityBadge";
import { getAvatarColor } from "@/utils/avatar";
import { getOverdueText, getDaysRemainingText } from "@/utils/date_helper";

type Bucket = "overdue" | "today" | "tomorrow" | "thisWeek";

interface UrgentTaskRowProps {
  card: Card;
  bucket: Bucket;
  columnTitle: string;
  onSelect: (card: Card) => void;
}

const PRIORITY_STRIPE: Record<NonNullable<Card["priority"]>, string> = {
  high: "bg-rose-400",
  medium: "bg-amber-400",
  low: "bg-emerald-400",
};

function dateLabel(card: Card, bucket: Bucket): { text: string; tone: string } {
  if (!card.due_date) return { text: "", tone: "text-slate-400" };
  if (bucket === "overdue") {
    return {
      text: getOverdueText(card.due_date),
      tone: "text-rose-600 font-bold",
    };
  }
  return {
    text: getDaysRemainingText(card.due_date),
    tone:
      bucket === "today"
        ? "text-orange-600 font-semibold"
        : bucket === "tomorrow"
          ? "text-amber-600 font-semibold"
          : "text-slate-500",
  };
}

export function UrgentTaskRow({
  card,
  bucket,
  columnTitle,
  onSelect,
}: UrgentTaskRowProps) {
  const initial =
    card.assignee_name?.trim().charAt(0).toUpperCase() ?? "";
  const label = dateLabel(card, bucket);

  return (
    <button
      type="button"
      onClick={() => onSelect(card)}
      className="group relative w-full flex items-center gap-3 py-2 pl-3 pr-2 rounded-md hover:bg-slate-50 border-b border-slate-100 last:border-b-0 hover:border-transparent transition-colors text-left"
    >
      {card.priority && (
        <span
          aria-hidden
          className={`absolute left-0 top-2 bottom-2 w-0.5 rounded-full ${PRIORITY_STRIPE[card.priority]}`}
        />
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-800 truncate">
            {card.title}
          </span>
          {columnTitle && (
            <span className="px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 bg-slate-100 rounded whitespace-nowrap">
              {columnTitle}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {card.assignee_id && card.assignee_name && (
          <div
            title={card.assignee_name}
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${getAvatarColor(card.assignee_id)}`}
          >
            {initial}
          </div>
        )}

        {card.priority && <PriorityBadge priority={card.priority} />}

        {label.text && (
          <span className={`text-xs whitespace-nowrap ${label.tone}`}>
            {label.text}
          </span>
        )}

        {card.estimated_hours != null && (
          <div className="hidden sm:flex items-center gap-1 text-xs font-medium text-slate-400 w-12 justify-end">
            <Clock size={12} />
            <span>{card.estimated_hours}h</span>
          </div>
        )}
      </div>
    </button>
  );
}
