// components/kanban/Card.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import { Calendar, User, Trash2 } from "lucide-react";
import type { Card } from "@/types/board";

interface CardProps {
  card: Card;
  onDelete: (cardId: string) => void;
}

export function KanbanCard({ card, onDelete }: CardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      data: { currentColumnId: card.column_id },
    });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)` }
    : undefined;

  const isOverdue =
    card.due_date && new Date(card.due_date) < new Date();


    
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
        className={`group relative bg-white p-5 rounded-2xl border border-transparent 
        ${
          isDragging
            ? "shadow-2xl opacity-90 rotate-2 cursor-grabbing" 
            : "shadow-sm cursor-grab hover:shadow-md hover:border-slate-200 transition-shadow duration-200" 
        }
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold text-slate-700 leading-snug">
          {card.title}
        </p>
        <button
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(card.id)}
          className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all shrink-0"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {(card.due_date || card.assignee) && (
        <div className="flex items-center gap-3 mt-3">
          {card.due_date && (
            <span
              className={`flex items-center gap-1 text-xs font-medium ${
                isOverdue ? "text-red-500" : "text-slate-400"
              }`}
            >
              <Calendar size={12} />
              {new Date(card.due_date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
          {card.assignee && (
            <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
                {card.assignee.charAt(0).toUpperCase()}
              </div>
              {card.assignee}
            </span>
          )}
        </div>
      )}
    </div>
  );
}