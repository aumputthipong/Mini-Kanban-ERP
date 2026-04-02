// components/kanban/TaskCard.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import { Calendar, CheckSquare, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Card } from "@/types/board";
import { CardDetailModal, FormState } from "./card-modal/CardDetailModal";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardActions } from "@/hooks/useBoardActions";

interface CardProps {
  card: Card;
  boardId: string;
  onDeleteCard: (cardId: string) => void;
  onSaveCard: (cardId: string, form: FormState) => void;
}

export function TaskCard({
  card,
  boardId,
  onDeleteCard,
  onSaveCard,
}: CardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { updateCard } = useBoardStore();
  const totalSubtasks = card.subtasks?.length || 0;
  const completedSubtasks =
    card.subtasks?.filter((st) => st.is_completed).length || 0;
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      data: { currentColumnId: card.column_id },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const isOverdue = card.due_date && new Date(card.due_date) < new Date();

  const getPriorityClasses = (priority?: string | null) => {
    switch (priority) {
      case "high":
        return "bg-red-50 text-red-700 border-red-200";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "hidden";
    }
  };
  const { handleAddSubtask } = useBoardActions(boardId);
  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => setIsDetailOpen(true)}
        className={`group relative bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3
          ${
            isDragging
              ? "shadow-2xl opacity-80 rotate-2 cursor-grabbing z-50 ring-2 ring-blue-500"
              : "shadow-sm cursor-grab hover:shadow-md hover:border-blue-300 transition-all duration-200"
          }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            {card.priority && (
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border w-fit ${getPriorityClasses(card.priority)}`}
              >
                {card.priority}
              </span>
            )}
            <p className="text-sm font-semibold text-slate-700 leading-snug">
              {card.title}
            </p>
          </div>
        </div>

        {(card.due_date || card.assignee_name || totalSubtasks > 0) && (
          <div className="flex items-center gap-3">
            {/* ... โค้ด Calendar และ Assignee คงเดิม ... */}

            {/* UI แสดงจำนวน Subtask */}
            {totalSubtasks > 0 && (
              <span
                className={`flex items-center gap-1 text-xs font-medium ${completedSubtasks === totalSubtasks ? "text-emerald-500" : "text-slate-400"}`}
              >
                <CheckSquare size={12} />
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
          </div>
        )}
      </div>

      <CardDetailModal
        card={card}
        boardId={boardId}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdated={(cardId, form) => {
          // เปลี่ยน signature
          onSaveCard(cardId, form);
          setIsDetailOpen(false);
        }}
        onDelete={(cardId) => {
          onDeleteCard(cardId);
          setIsDetailOpen(false);
        }}
        onAddSubtask = { handleAddSubtask }
      />
    </>
  );
}
