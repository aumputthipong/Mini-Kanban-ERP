// components/kanban/TaskCard.tsx
"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import {
  Calendar,
  Clock,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import dynamic from "next/dynamic";
import type { Card } from "@/types/board";
import type { FormState } from "../card-modal/CardDetailModal";

const CardDetailModal = dynamic(
  () =>
    import("../card-modal/CardDetailModal").then((m) => ({
      default: m.CardDetailModal,
    })),
  { ssr: false },
);
import { useBoardActions } from "@/hooks/useBoardActions";
import { useCanEdit } from "@/hooks/useCanEdit";
import { CSS } from "@dnd-kit/utilities";
import { formatThaiDate } from "@/utils/date_helper";
import { getAvatarColor } from "@/utils/avatar";
import { PriorityBadge } from "@/components/board/task-board/PriorityBadge";
import { TagChip } from "@/components/board/task-board/TagChip";

interface CardProps {
  card: Card;
  boardId: string;
  onDeleteCard: (cardId: string) => void;
  onSaveCard: (cardId: string, form: FormState) => void;
}

export const TaskCard = memo(function TaskCard({
  card,
  boardId,
  onDeleteCard,
  onSaveCard,
}: CardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const { handleAddSubtask } = useBoardActions(boardId);
  const canEdit = useCanEdit(card);

  const totalSubtasks = card.total_subtasks ?? 0;
  const completedSubtasks = card.completed_subtasks ?? 0;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: { currentColumnId: card.column_id },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => setIsDetailOpen(true)}
        className={`group relative p-5 rounded-2xl border flex flex-col gap-3 transition-all duration-200 select-none ${
          isDragging
            ? "opacity-0 pointer-events-none"
            : card.is_done
              ? "bg-slate-50/50 border-slate-200 opacity-80 shadow-sm cursor-grab"
              : "bg-white border-slate-200 shadow-sm cursor-grab hover:shadow-md hover:border-blue-300"
        }`}
      >
        {/* Top chip row — filled priority + tag chips. Mirrors the calendar
            hover popover's header so a card feels like the same primitive
            no matter which view it appears in. */}
        {((card.priority && !card.is_done) || (card.tags && card.tags.length > 0)) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {card.priority && !card.is_done && (
              <PriorityBadge priority={card.priority} variant="filled" />
            )}
            {card.tags && card.tags.length > 0 && (
              <>
                {card.tags.slice(0, 3).map((tag) => (
                  <TagChip key={tag.id} tag={tag} />
                ))}
                {card.tags.length > 3 && (
                  <span className="text-[10px] text-slate-400 font-semibold">
                    +{card.tags.length - 3}
                  </span>
                )}
              </>
            )}
          </div>
        )}

        <p
          className={`text-base font-bold leading-snug transition-all line-clamp-2 ${
            card.is_done ? "text-slate-400 line-through" : "text-slate-900"
          }`}
        >
          {card.title}
        </p>

        {/* Stacked info rows — each metadata point gets its own line with a
            leading icon, matching the popover treatment. Rows render only
            when their value exists; an empty card collapses cleanly. */}
        <div className="flex flex-col gap-1.5">
          {card.due_date && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Calendar size={12} className="text-slate-400 shrink-0" />
              <span>Due {formatThaiDate(card.due_date)}</span>
            </div>
          )}
          {card.estimated_hours != null && (
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Clock size={12} className="text-slate-400 shrink-0" />
              <span>Estimated {card.estimated_hours}h</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <UserRound size={12} className="text-slate-400 shrink-0" />
            {card.assignee_name && card.assignee_id ? (
              <span className="flex items-center gap-1.5">
                <span
                  className={`flex h-[18px] w-[18px] items-center justify-center rounded-full text-[9px] font-bold text-white ${getAvatarColor(card.assignee_id)}`}
                >
                  {card.assignee_name.charAt(0).toUpperCase()}
                </span>
                <span className="text-slate-700">{card.assignee_name}</span>
              </span>
            ) : (
              <span className="text-slate-400 italic">Unassigned</span>
            )}
          </div>
        </div>

        {/* Subtask progress — kept as a horizontal bar at the bottom so the
            card's progress reads at a glance without opening detail. */}
        {totalSubtasks > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex-1 bg-slate-100 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full transition-all duration-300 ${
                  completedSubtasks === totalSubtasks
                    ? "bg-emerald-500"
                    : "bg-blue-400"
                }`}
                style={{
                  width: `${Math.round((completedSubtasks / totalSubtasks) * 100)}%`,
                }}
              />
            </div>
            <span
              className={`text-[10px] font-semibold ${
                completedSubtasks === totalSubtasks
                  ? "text-emerald-500"
                  : "text-slate-400"
              }`}
            >
              {completedSubtasks}/{totalSubtasks}
            </span>
          </div>
        )}
      </div>

      {isDetailOpen && (
        <CardDetailModal
          key={card.id}
          card={card}
          boardId={boardId}
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          onUpdated={(cardId, form) => {
            onSaveCard(cardId, form);
            setIsDetailOpen(false);
          }}
          onDelete={(cardId) => {
            onDeleteCard(cardId);
            setIsDetailOpen(false);
          }}
          onAddSubtask={handleAddSubtask}
          canEdit={canEdit}
        />
      )}
    </>
  );
});
