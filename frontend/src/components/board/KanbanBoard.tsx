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
  const { handleDragStart, handleDragEnd, handleAddCard, handleDeleteCard, handleUpdateCard } =
    useBoardActions(boardId);

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  // local state สำหรับ drop indicator เท่านั้น — ไม่ยุ่ง store เลย
  const [dropTarget, setDropTarget] = useState<{
    columnId: string;
    beforeCardId: string | null;
  } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const onDragStart = (event: DragStartEvent) => {
    handleDragStart();
    const card = columns
      .flatMap((c) => c.cards)
      .find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      setDropTarget(null);
      return;
    }

    const overId = over.id as string;
    const activeCardId = active.id as string;

    // ตรวจว่า over คือ column หรือ card
    const isOverColumn = columns.some((c) => c.id === overId);
    let overColumnId: string;
    let beforeCardId: string | null = null;

    if (isOverColumn) {
      overColumnId = overId;
      beforeCardId = null; // ต่อท้าย column
    } else {
      const overCol = columns.find((col) => col.cards.some((c) => c.id === overId));
      if (!overCol) { setDropTarget(null); return; }
      overColumnId = overCol.id;
      // ถ้า over เป็นการ์ดในต้น column เดียวกัน ไม่แสดง indicator (SortableContext จัดการเอง)
      const activeCol = columns.find((col) => col.cards.some((c) => c.id === activeCardId));
      if (activeCol?.id === overColumnId) { setDropTarget(null); return; }
      beforeCardId = overId;
    }

    // ถ้าอยู่ column เดิม ไม่แสดง indicator
    const activeCol = columns.find((col) => col.cards.some((c) => c.id === activeCardId));
    if (activeCol?.id === overColumnId) { setDropTarget(null); return; }

    setDropTarget({ columnId: overColumnId, beforeCardId });
  };

  const onDragEnd: typeof handleDragEnd = (event) => {
    setDropTarget(null);
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
            dropIndicatorBeforeId={
              dropTarget?.columnId === col.id ? dropTarget.beforeCardId : undefined
            }
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