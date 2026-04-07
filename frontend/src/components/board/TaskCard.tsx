// components/kanban/TaskCard.tsx
"use client";

import { useSortable } from "@dnd-kit/sortable";
import { Calendar, CheckCircle2, Circle, Clock } from "lucide-react";
import { useState } from "react";
import type { Card } from "@/types/board";
import { CardDetailModal, FormState } from "./card-modal/CardDetailModal";
import { useBoardActions } from "@/hooks/useBoardActions";
import { useCanEdit } from "@/hooks/useCanEdit";
import { CSS } from "@dnd-kit/utilities";
import { formatThaiDate } from "@/ีutils/date_helper";

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

  const { handleAddSubtask, handleToggleDone, handleToggleSubtask } =
    useBoardActions(boardId);
  const canEdit = useCanEdit(card);

  const totalSubtasks = card.total_subtasks ?? 0;
  const completedSubtasks = card.completed_subtasks ?? 0;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({
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
        className={`group relative p-4 rounded-xl border flex flex-col gap-3
    ${isDragging
        ? "opacity-0 pointer-events-none"
        : card.is_done
          ? "bg-slate-50/50 border-slate-200 opacity-80 shadow-sm cursor-grab"
          : "bg-white border-slate-200 shadow-sm cursor-grab hover:shadow-md hover:border-blue-300 transition-all duration-200"
    }`}
      >
        {/* DEBUG: แสดง position — ลบทิ้งเมื่อ debug เสร็จ */}
        <span className="absolute top-1 right-1 text-[9px] font-mono text-slate-300 select-none pointer-events-none">
          {card.position.toFixed(2)}
        </span>
        <div className="flex items-start gap-3">
          {/* 3. ปุ่ม Checkbox สำหรับ Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleDone(card);
            }}
            onPointerDown={(e) => e.stopPropagation()}
            className={`mt-0.5 transition-colors ${
              card.is_done
                ? "text-emerald-500"
                : "text-slate-300 hover:text-slate-400"
            }`}
          >
            {card.is_done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
          </button>

          <div className="flex flex-col gap-1.5 flex-1">
            {card.priority && !card.is_done && (
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border w-fit 
                ${
                  card.priority === "high"
                    ? "bg-red-50 text-red-700 border-red-200"
                    : card.priority === "medium"
                      ? "bg-amber-50 text-amber-700 border-amber-200"
                      : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {card.priority}
              </span>
            )}
            <p
              className={`text-sm font-semibold leading-snug transition-all
              ${card.is_done ? "text-slate-400 line-through" : "text-slate-700"}`}
            >
              {card.title}
            </p>
          </div>
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
            {/* Subtask rows */}
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
        {(card.due_date || card.estimated_hours || card.assignee_id) && (
          <div className="flex items-center justify-between pl-7 pt-1">
            <div className="flex items-center gap-2">
              {card.due_date && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Calendar size={10} />
                  {formatThaiDate(card.due_date)}
                </span>
              )}
              {card.estimated_hours != null && (
                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                  <Clock size={10} />
                  {card.estimated_hours}h
                </span>
              )}
            </div>
            {card.assignee_name && (
              <div
                className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                title={card.assignee_name}
              >
                {card.assignee_name.charAt(0).toUpperCase()}
              </div>
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
        onAddSubtask={handleAddSubtask}
        canEdit={canEdit}
      />
    </>
  );
}
