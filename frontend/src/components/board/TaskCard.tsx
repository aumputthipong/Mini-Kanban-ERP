// components/kanban/TaskCard.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import {
  Calendar,
  CheckCircle2,
  CheckSquare,
  Circle,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Card } from "@/types/board";
import { CardDetailModal, FormState } from "./card-modal/CardDetailModal";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardActions } from "@/hooks/useBoardActions";
import { CSS } from "@dnd-kit/utilities";

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

  // 1. ดึงข้อมูล columns จาก Store เพื่อใช้หา target column
  const moveCard = useBoardStore((state) => state.moveCard);
  const { handleAddSubtask } = useBoardActions(boardId);

  const totalSubtasks = card.subtasks?.length || 0;
  const completedSubtasks =
    card.subtasks?.filter((st) => st.is_done).length || 0;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      data: { currentColumnId: card.column_id },
    });

  // 2. ฟังก์ชันจัดการ Toggle Done
  const handleToggleDone = (e: React.MouseEvent) => {
    e.stopPropagation();
    const columns = useBoardStore.getState().columns;
    if (card.is_done) {
      const todoCol = columns.find((col) => col.category === "TODO");
      if (todoCol) {
        const minPos =
          todoCol.cards.length > 0
            ? Math.min(...todoCol.cards.map((c) => c.position)) - 1000
            : 0;

        // ส่งพารามิเตอร์ 4 ตัวให้ครบ
        moveCard(card.id, card.column_id, todoCol.id, minPos);
      }
    } else {
      // ✅ ย้ายไป DONE
      const doneCol = columns.find((col) => col.category === "DONE");
      if (doneCol) {
        const maxPos =
          doneCol.cards.length > 0
            ? Math.max(...doneCol.cards.map((c) => c.position)) + 1000
            : 0;

        // ส่งพารามิเตอร์ 4 ตัวให้ครบ
        moveCard(card.id, card.column_id, doneCol.id, maxPos);
      }
    }
  };
  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        onClick={() => setIsDetailOpen(true)}
        className={`group relative p-4 rounded-xl border flex flex-col gap-3
    ${card.is_done ? "bg-slate-50/50 border-slate-200 opacity-80" : "bg-white border-slate-200"}
    ${
      isDragging
        ? "shadow-2xl rotate-2 cursor-grabbing z-50 ring-2 ring-blue-500 opacity-80"
        : "shadow-sm cursor-grab hover:shadow-md hover:border-blue-300 transition-all duration-200"
    }`}
      >
        <div className="flex items-start gap-3">
          {/* 3. ปุ่ม Checkbox สำหรับ Toggle */}
          <button
            onClick={handleToggleDone}
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

        {/* Footer ของ Card */}
        {(card.due_date || totalSubtasks > 0) && (
          <div className="flex items-center gap-3 pl-7">
            {" "}
            {/* pl-7 เพื่อให้เยื้องตรงกับ Title */}
            {totalSubtasks > 0 && (
              <span
                className={`flex items-center gap-1 text-xs font-medium 
                ${completedSubtasks === totalSubtasks ? "text-emerald-500" : "text-slate-400"}`}
              >
                <CheckSquare size={12} />
                {completedSubtasks}/{totalSubtasks}
              </span>
            )}
            {card.is_done && card.completed_at && (
              <span className="text-[10px] text-slate-400 italic">Done</span>
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
      />
    </>
  );
}
