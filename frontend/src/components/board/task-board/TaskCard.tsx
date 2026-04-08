// components/kanban/TaskCard.tsx
"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import {
  Calendar,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  UserRound,
} from "lucide-react";
import { useState } from "react";
import type { Card } from "@/types/board";
import {
  SignalBars,
  type Priority,
} from "@/components/board/task-board/PriorityFilterDropdown";
import { CardDetailModal, FormState } from "../card-modal/CardDetailModal";
import { useBoardActions } from "@/hooks/useBoardActions";
import { useCanEdit } from "@/hooks/useCanEdit";
import { CSS } from "@dnd-kit/utilities";
import { formatThaiDate } from "@/ีutils/date_helper";

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function avatarColor(userId: string) {
  return AVATAR_COLORS[userId.charCodeAt(0) % AVATAR_COLORS.length];
}

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

  const { handleAddSubtask, handleToggleDone, handleToggleSubtask } =
    useBoardActions(boardId);
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
        className={`group relative p-4 rounded-xl border flex flex-col gap-3 transition-all duration-200 ${
          isDragging
            ? "opacity-0 pointer-events-none"
            : card.is_done
              ? "bg-slate-50/50 border-slate-200 opacity-80 shadow-sm cursor-grab"
              : "bg-white border-slate-200 shadow-sm cursor-grab hover:shadow-md hover:border-blue-300"
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {card.priority && !card.is_done && (
              <span
                className={`text-[10px] flex items-center leading-none justify-center gap-1 font-bold  uppercase px-2 py-0.5 rounded border w-fit ${
                  card.priority === "high"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : card.priority === "medium"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                <SignalBars priority={card.priority as Priority} size={12} />
                <span className="">{card.priority}</span>
              </span>
            )}

            <p
              className={`text-sm font-semibold leading-snug transition-all line-clamp-2  ${
                card.is_done ? "text-slate-400 line-through" : "text-slate-700"
              }`}
            >
              {card.title}
            </p>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleDone(card);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`shrink-0 mt-0.5 w-6 h-6 rounded flex items-center justify-center transition-all cursor-pointer ${
              card.is_done
                ? "bg-emerald-100 text-emerald-600 hover:bg-emerald-200" // ตอนเสร็จ: สีเขียวชัดเจน
                : "bg-slate-50 text-slate-300 border border-slate-200 hover:bg-emerald-50 hover:text-emerald-500 hover:border-emerald-200 opacity-0 group-hover:opacity-100" // ตอนยังไม่เสร็จ: ซ่อนไว้โชว์แค่ตอน Hover
            }`}
            title={card.is_done ? "Mark as Undone" : "Mark as Done"}
          >
            {/* ใช้ไอคอน Check หนาๆ แทนวงกลม */}
            <Check strokeWidth={card.is_done ? 3 : 2} size={14} />
          </button>
        </div>

        {/* Subtasks inline */}
        {totalSubtasks > 0 && (
          <div className="flex flex-col gap-1 pl-7">
            <div className="flex items-center gap-2 mb-1">
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
            {card.subtasks?.map((st) => (
              <div
                key={st.id}
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                <input
                  type="checkbox"
                  checked={st.is_done}
                  onChange={() =>
                    handleToggleSubtask(card.id, st.id, st.is_done)
                  }
                  className="rounded border-slate-300 text-blue-500 focus:ring-blue-400 cursor-pointer"
                />
                <span
                  className={`text-xs ${st.is_done ? "line-through text-slate-400" : "text-slate-600"}`}
                >
                  {st.title}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer — due date, estimated hours, assignee */}
        <div className="flex items-center justify-between pl-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar size={10} />
              {card.due_date ? formatThaiDate(card.due_date) : "-"}
            </span>

            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Clock size={10} />
              {card.estimated_hours ? `${card.estimated_hours} h` : "-"}
            </span>
          </div>

          {card.assignee_name && card.assignee_id ? (
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${avatarColor(card.assignee_id)}`}
              title={card.assignee_name}
            >
              {card.assignee_name.charAt(0).toUpperCase()}
            </div>
          ) : (
            <div
              className="w-6 h-6 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center shrink-0"
              title="Unassigned"
            >
              <UserRound size={12} className="text-slate-300" />
            </div>
          )}
        </div>
      </div>

      <CardDetailModal
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
    </>
  );
});
