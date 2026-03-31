// components/kanban/Column.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus, X } from "lucide-react";
import { useState, useRef } from "react";
import { TaskCard } from "./TaskCard";
import type { Card } from "@/types/board";

interface ColumnProps {
  id: string;
  title: string;
  cards: Card[];
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
}

export function KanbanColumn({
  id,
  title,
  cards,
  onAddCard,
  onDeleteCard,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isAdding, setIsAdding] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    if (!cardTitle.trim()) return;
    onAddCard(id, cardTitle.trim());
    setCardTitle("");
    setIsAdding(false);
  };

  const handleCancel = () => {
    setCardTitle("");
    setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") handleCancel();
  };

  return (
    <div
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-2xl p-4 flex flex-col gap-3 transition-colors
        ${isOver ? "bg-blue-50 border-2 border-blue-300" : "bg-slate-100 border-2 border-transparent"}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-700">{title}</h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>
      {isAdding ? (
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
          <input
            ref={inputRef}
            autoFocus
            type="text"
            placeholder="Card title"
            value={cardTitle}
            onChange={(e) => setCardTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={!cardTitle.trim()}
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Add Card
            </button>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 p-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
        >
          <Plus size={16} />
          Add card
        </button>
      )}
      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <TaskCard key={card.id} card={card} onDeleteCard={onDeleteCard}  />
        ))}
      </div>
    </div>
  );
}
