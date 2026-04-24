// components/kanban/Column.tsx
"use client";

import { memo, useState, useMemo } from "react";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { MoreHorizontal, Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";
import { AddCardForm } from "./AddCardForm";
import type { Card, Column } from "@/types/board";
import { FormState } from "../card-modal/CardDetailModal";
import { ColumnOptionsModal, getColumnColorHex } from "./ColumnOptionsModal";
import { useCanManageBoard } from "@/hooks/useBoardRole";

interface ColumnProps {
  id: string;
  title: string;
  category: Column["category"];
  color?: string | null;
  boardId: string;
  cards: Card[];
  onAddCard: (columnId: string, title: string) => void;
  onDeleteCard: (cardId: string) => void;
  onSaveCard: (cardId: string, form: FormState) => void;
  onDeleteColumn: (columnId: string) => void;
  onUpdateColumn: (
    columnId: string,
    title: string,
    category: "TODO" | "DONE",
    color: string | null,
  ) => void;
  filterAssigneeId?: string | null;
  filterPriorities?: string[];
  filterTagIds?: string[];
  dropIndicatorBeforeId?: string | null;
}

const DropIndicator = () => (
  <div className="h-0.5 bg-blue-400 rounded-full mx-1 my-0.5" />
);

export const KanbanColumn = memo(function KanbanColumn({
  id,
  boardId,
  title,
  category,
  color,
  cards,
  onAddCard,
  onDeleteCard,
  onSaveCard,
  onDeleteColumn,
  onUpdateColumn,
  filterAssigneeId,
  filterPriorities,
  filterTagIds,
  dropIndicatorBeforeId,
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [topAddOpen, setTopAddOpen] = useState(false);
  const canManage = useCanManageBoard();

  const visibleCards = useMemo(
    () =>
      cards.filter(
        (card) =>
          (filterAssigneeId == null || card.assignee_id === filterAssigneeId) &&
          (filterPriorities == null ||
            filterPriorities.length === 0 ||
            filterPriorities.includes(card.priority ?? "")) &&
          (filterTagIds == null ||
            filterTagIds.length === 0 ||
            (card.tags?.some((t) => filterTagIds.includes(t.id)) ?? false)),
      ),
    [cards, filterAssigneeId, filterPriorities, filterTagIds],
  );

const colorHex = getColumnColorHex(color);

  // 1. สร้างตัวแปรเก็บสีทึบ 100% แต่อ่อนละมุนไว้ใช้ร่วมกัน
  const solidBgStyle = colorHex 
    ? { backgroundColor: `color-mix(in srgb, ${colorHex} 12%, white)` } 
    : undefined;
  return (
    <>
      <div
        ref={setNodeRef}
        className={`
          w-72 shrink-0 flex flex-col snap-start 
          rounded-2xl border-2 transition-all duration-200
          ${!colorHex && isOver ? "border-blue-300 bg-blue-50" : "border-transparent"}
          ${!colorHex && !isOver ? "bg-slate-100" : ""}
        `}
        style={solidBgStyle}
      >
        {/* Sticky header — title row */}
      <div
          className={`sticky top-0 z-10 rounded-t-2xl transition-colors pb-2 ${
            !colorHex ? (isOver ? "bg-blue-50" : "bg-slate-100") : ""
          }`}
          // 2. เปลี่ยนตรงนี้ให้ใช้ solidBgStyle เหมือนกล่องแม่!
          style={solidBgStyle} 
        >
          <div className="flex items-center justify-between gap-3 px-4 pt-4">
            <h2 className="font-bold text-slate-700 leading-tight truncate flex-1">
              {title}
            </h2>

            <div className="flex items-center gap-1 shrink-0">
              <span className="text-xs font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full min-w-5 text-center">
                {cards.length}
              </span>

              <button
                onClick={() => setTopAddOpen(true)}
                title="Add card"
                className="cursor-pointer text-slate-400 hover:text-blue-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
              >
                <Plus size={16} />
              </button>

              {canManage && (
                <button
                  onClick={() => setOptionsOpen(true)}
                  title="Column options"
                  className="cursor-pointer text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-200 transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Card List — fills remaining column height */}
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="px-4 pb-4 flex flex-col gap-2 flex-1">
            {topAddOpen && (
              <AddCardForm
                defaultOpen
                onAdd={(title) => {
                  onAddCard(id, title);
                  setTopAddOpen(false);
                }}
                onDismiss={() => setTopAddOpen(false)}
              />
            )}
            {visibleCards.map((card) => (
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
      </div>

      <ColumnOptionsModal
        open={optionsOpen}
        columnId={id}
        initialTitle={title}
        initialCategory={category}
        initialColor={color ?? null}
        cardCount={cards.length}
        onSave={(t, cat, col) => onUpdateColumn(id, t, cat, col)}
        onDelete={() => onDeleteColumn(id)}
        onClose={() => setOptionsOpen(false)}
      />
    </>
  );
});
