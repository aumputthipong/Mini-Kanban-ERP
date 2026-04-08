// components/kanban/Column.tsx
"use client";

import { memo, useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { TaskCard } from "./TaskCard";
import type { Card } from "@/types/board";
import { FormState } from "../card-modal/CardDetailModal";
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
  filterPriorities?: string[];
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
  filterPriorities,
  dropIndicatorBeforeId,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [isAdding, setIsAdding] = useState(false);
  const [cardTitle, setCardTitle] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

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
        className={`w-72 shrink-0 rounded-2xl flex flex-col transition-colors max-h-full snap-start ${
          isOver
            ? "bg-blue-50 border-2 border-blue-300"
            : "bg-slate-100 border-2 border-transparent"
        }`}
      >
        {/* Header — sticky */}
        <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2 shrink-0">
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
              <h2 className="font-bold text-slate-700 leading-tight transition-colors truncate">
                {title}
              </h2>
            )}
          </div>

          {/* Right: count, ⋯ */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full min-w-5 text-center">
              {cards.length}
            </span>

            {/* ⋯ menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className=" cursor-pointer text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
              >
                <MoreHorizontal size={16} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-7 z-20 bg-white rounded-xl shadow-lg border border-slate-100 py-1 w-40 text-sm">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setIsRenaming(true);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    <Pencil size={14} /> Rename
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirmOpen(true);
                    }}
                    className="flex items-center gap-2 w-full px-3 py-2 hover:bg-red-50 text-red-500 transition-colors"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card List — scrollable */}
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="kanban-scroll flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 flex flex-col gap-2 min-h-0">
            {cards
              .filter(
                (card) =>
                  (filterAssigneeId == null ||
                    card.assignee_id === filterAssigneeId) &&
                  (filterPriorities == null ||
                    filterPriorities.length === 0 ||
                    filterPriorities.includes(card.priority ?? "")),
              )
              .map((card) => (
                <div key={card.id}>
                  {dropIndicatorBeforeId === card.id && <DropIndicator />}
                  <TaskCard
                    boardId={boardId}
                    card={card}
                    onDeleteCard={onDeleteCard}
                    onSaveCard={onSaveCard}
                  />
                </div>
              ))}
            {dropIndicatorBeforeId === null && <DropIndicator />}
          </div>
        </SortableContext>

        {/* Add Card footer — sticky */}
        <div className="shrink-0 px-4 pb-4 pt-1">
          {isAdding ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2.5 flex flex-col gap-2">
              <input
                ref={addInputRef}
                autoFocus
                type="text"
                placeholder="Card title..."
                value={cardTitle}
                onChange={(e) => setCardTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 border border-transparent rounded-md px-2 py-1 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
              />
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSubmit}
                  disabled={!cardTitle.trim()}
                  className="flex-1 bg-blue-600 text-white text-xs font-semibold py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Card
                </button>
                <button
                  onClick={handleCancel}
                  className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setIsAdding(true);
                setTimeout(() => addInputRef.current?.focus(), 0);
              }}
              className="cursor-pointer w-full flex items-center gap-1.5 px-2 py-1.5 text-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <Plus size={16} /> Add card
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete "${title}"?`}
        description="All cards in this column will be permanently deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setConfirmOpen(false);
          onDeleteColumn(id);
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
});
