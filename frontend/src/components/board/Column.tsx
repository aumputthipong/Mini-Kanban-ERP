// components/kanban/Column.tsx
"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus, X } from "lucide-react";
import { useState, useRef } from "react";
import { TaskCard } from "./TaskCard";
import type { Card } from "@/types/board";
import { FormState } from "./CardDetailModal";

interface ColumnProps {
  id: string;
  title: string;
  boardId: string;
  cards: Card[];
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onSaveCard: (cardId: string, form: FormState) => void;
}

export function KanbanColumn({
  id,
  boardId,
  title,
  cards,
  onAddCard,
  onDeleteCard,
  onSaveCard,
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
      className={`w-72 shrink-0 rounded-2xl p-4 flex flex-col gap-3 transition-colors ${
        isOver
          ? "bg-blue-50 border-2 border-blue-300"
          : "bg-slate-100 border-2 border-transparent"
      }`}
    >
      {/* --- Header Section (ชื่อ Column, ปุ่ม Add, ตัวเลข) --- */}
      {/* ใช้ items-start เพื่อให้เวลาช่อง input ขยายตัว หัวข้อหลักจะไม่ขยับขึ้นลงตาม */}
      <div className="flex items-start justify-between gap-3 px-1">
        {/* ก้อนซ้าย: ชื่อ Column และ ช่อง Input (ถ้ากำลัง Add) */}
        <div className="flex-1 flex flex-col gap-2.5">
          <h2 className="font-bold text-slate-700 leading-tight">{title}</h2>

          {/* ส่วน Add Card Form แบบ Inline: จะแสดงแทนที่ปุ่ม "+" เมื่อ isAdding เป็น true */}
          {isAdding && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2.5 flex flex-col gap-2 animate-in fade-in slide-in-from-top-1 duration-150">
              <input
                ref={inputRef}
                autoFocus
                type="text"
                placeholder="Card title..."
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 border border-transparent rounded-md px-2 py-1 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <div className="flex items-center gap-1.5 mt-1">
                <button
                  onClick={handleSubmit}
                  disabled={!cardTitle.trim()}
                  className="flex-1 bg-blue-600 text-white text-xs font-semibold py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Card
                </button>
                <button
                  onClick={handleCancel}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-100 transition-colors shrink-0"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ก้อนขวา: ปุ่ม "+" หรือ ตัวเลขจำนวนการ์ด */}
        <div className="flex items-center gap-2 shrink-0">
          {/* แสดงปุ่ม "+" เฉพาะตอนไม่ได้อยู่ในโหมด Add */}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors"
              title="Add a new card to this column"
            >
              <Plus size={18} />
            </button>
          )}

          {/* ตัวเลขจำนวนการ์ด (อยู่ขวาสุดเสมอ) */}
          <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full min-w-[20px] text-center">
            {cards.length}
          </span>
        </div>
      </div>

      {/* --- Card List Section (วนลูปการ์ดที่มีอยู่) --- */}
      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <TaskCard
            boardId={boardId}
            key={card.id}
            card={card}
            onDeleteCard={onDeleteCard}
            onSaveCard={onSaveCard}
          />
        ))}
      </div>
    </div>
  );
}
