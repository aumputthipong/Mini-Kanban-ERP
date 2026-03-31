// components/kanban/TaskCard.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import { Calendar, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Card } from "@/types/board";
import { CardDetailModal, FormState } from "./CardDetailModal";
import { useBoardStore } from "@/store/useBoardStore";

interface CardProps {
  card: Card;
  onDeleteCard: (cardId: string) => void;
  onSaveCard: (cardId: string, form: FormState) => void;
}

export function TaskCard({ card, onDeleteCard, onSaveCard }: CardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const { updateCard } = useBoardStore();

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

        {(card.due_date || card.assignee_name) && (
          <div className="flex items-center gap-3">
            {card.due_date && (
              <span
                className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? "text-red-500" : "text-slate-400"}`}
              >
                <Calendar size={12} />
                {new Date(card.due_date).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
            {card.assignee_name && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {card.assignee_name.charAt(0).toUpperCase()}
                </div>
                {card.assignee_name}
              </span>
            )}
          </div>
        )}
      </div>

      <CardDetailModal
        card={card}
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
      />
    </>
  );
}
