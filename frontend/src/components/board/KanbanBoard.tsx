// components/board/KanbanBoard.tsx
"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/board/Column";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardActions } from "@/hooks/useBoardActions";
import type { Card } from "@/types/board";

// ── Card preview ที่ลอยตามเมาส์ระหว่าง drag ──────────────────────────────────
function DragPreview({ card }: { card: Card }) {
  return (
    <div className="p-4 rounded-xl border bg-white border-blue-400 shadow-2xl ring-2 ring-blue-500 rotate-2 opacity-95 w-72 cursor-grabbing">
      {card.priority && (
        <span
          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border mb-1.5 inline-block ${
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
      <p className="text-sm font-semibold text-slate-700 leading-snug">{card.title}</p>
    </div>
  );
}

export function KanbanBoard({ boardId }: { boardId: string }) {
  const { columns } = useBoardStore();
  const { handleDragEnd, handleDragOver, handleAddCard, handleDeleteCard, handleUpdateCard } =
    useBoardActions(boardId);

  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const onDragStart = (event: DragStartEvent) => {
    const card = columns
      .flatMap((c) => c.cards)
      .find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  };

  const onDragOver = (event: DragOverEvent) => {
    handleDragOver(event);
  };

  const onDragEnd: typeof handleDragEnd = (event) => {
    handleDragEnd(event);
    setActiveCard(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4 items-start">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            boardId={boardId}
            title={col.title}
            cards={col.cards}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
            onSaveCard={handleUpdateCard}
          />
        ))}
      </div>

      {/* การ์ดที่ลอยตามเมาส์ — แยกออกจาก SortableContext ทุก column */}
      <DragOverlay dropAnimation={null}>
        {activeCard ? <DragPreview card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}