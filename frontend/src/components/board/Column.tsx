// components/kanban/Column.tsx
"use client";

import { memo, useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus, X, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { TaskCard } from "./TaskCard";
import type { Card } from "@/types/board";
import { FormState } from "./card-modal/CardDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface ColumnProps {
  id: string;
  title: string;
  boardId: string;
  cards: Card[];
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onSaveCard: (cardId: string, form: FormState) => void;
  onRenameColumn: (columnId: string, title: string) => void;
  onDeleteColumn: (columnId: string) => void;
  filterAssigneeId?: string | null;
  // null = แสดงที่ท้าย column, string = แสดงก่อน card id นั้น, undefined = ไม่แสดง
  dropIndicatorBeforeId?: string | null;
}

const DropIndicator = () => (
  <div className="h-0.5 bg-blue-400 rounded-full mx-1 my-0.5" />
);

export const KanbanColumn = memo(function KanbanColumn({
  id,
  boardId,
  title,
  cards,
  onAddCard,
  onDeleteCard,
  onSaveCard,
  onRenameColumn,
  onDeleteColumn,
  filterAssigneeId,
  dropIndicatorBeforeId,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isAdding, setIsAdding] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ⋯ menu
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // inline rename
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(title);
  const renameInputRef = useRef<HTMLInputElement>(null);

  // confirm delete
  const [confirmOpen, setConfirmOpen] = useState(false);

  // ปิด menu เมื่อคลิกนอก
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // focus rename input เมื่อเปิด
  useEffect(() => {
    if (isRenaming) {
      setRenameValue(title);
      setTimeout(() => renameInputRef.current?.select(), 0);
    }
  }, [isRenaming, title]);

  const submitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== title) {
      onRenameColumn(id, trimmed);
    }
    setIsRenaming(false);
  };

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
    <>
      <div
        ref={setNodeRef}
        className={`w-72 shrink-0 rounded-2xl p-4 flex flex-col gap-3 transition-colors ${
          isOver
            ? "bg-blue-50 border-2 border-blue-300"
            : "bg-slate-100 border-2 border-transparent"
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-1">
          <div className="flex-1 flex flex-col gap-2.5 min-w-0">
            {/* Title / inline rename */}
            {isRenaming ? (
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={submitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitRename();
                  if (e.key === "Escape") setIsRenaming(false);
                }}
                className="font-bold text-slate-700 leading-tight bg-white border border-blue-400 rounded-md px-2 py-0.5 text-sm outline-none ring-2 ring-blue-100 w-full"
              />
            ) : (
              <h2
                className="font-bold text-slate-700 leading-tight cursor-pointer hover:text-blue-600 transition-colors truncate"
                onDoubleClick={() => setIsRenaming(true)}
                title="Double-click to rename"
              >
                {title}
              </h2>
            )}

            {/* Add Card inline form */}
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

          {/* Right: +, count, ⋯ */}
          <div className="flex items-center gap-1 shrink-0">
            {!isAdding && (
              <button
                onClick={() => setIsAdding(true)}
                className="text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-blue-50 transition-colors"
                title="Add a new card"
              >
                <Plus size={18} />
              </button>
            )}
            <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full min-w-5 text-center">
              {cards.length}
            </span>

            {/* ⋯ menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-40 text-sm">
                  <button
                    onClick={() => { setMenuOpen(false); setIsRenaming(true); }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <Pencil size={14} /> Rename
                  </button>
                  <button
                    onClick={() => { setMenuOpen(false); setConfirmOpen(true); }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card List */}
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-2">
            {cards.map((card) => (
              <div key={card.id}>
                {dropIndicatorBeforeId === card.id && <DropIndicator />}
                <TaskCard
                  boardId={boardId}
                  card={card}
                  onDeleteCard={onDeleteCard}
                  onSaveCard={onSaveCard}
                  filterAssigneeId={filterAssigneeId}
                />
              </div>
            ))}
            {dropIndicatorBeforeId === null && <DropIndicator />}
          </div>
        </SortableContext>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${title}"?`}
        description="All cards in this column will be permanently deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { setConfirmOpen(false); onDeleteColumn(id); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
});
