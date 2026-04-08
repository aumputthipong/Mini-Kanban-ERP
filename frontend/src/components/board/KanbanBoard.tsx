// components/board/KanbanBoard.tsx
"use client";

import { useState, useRef } from "react";
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
import { usePanBoard } from "@/hooks/usePanBoard";

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
  const { columns, filterAssigneeId } = useBoardStore();
  const {
    handleDragStart, handleDragEnd, handleAddCard,
    handleRenameColumn, handleDeleteColumn, handleDeleteCard, handleUpdateCard,
  } = useBoardActions(boardId);

  const todoColumns = columns.filter((c) => c.category !== "DONE");
  const doneColumns = columns.filter((c) => c.category === "DONE");

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    columnId: string;
    beforeCardId: string | null;
  } | null>(null);

  const boardScrollRef = useRef<HTMLDivElement>(null);
  usePanBoard(boardScrollRef);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const onDragStart = (event: DragStartEvent) => {
    handleDragStart();
    const card = columns.flatMap((c) => c.cards).find((c) => c.id === event.active.id);
    setActiveCard(card ?? null);
  };

  const onDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) { setDropTarget(null); return; }

    const overId = over.id as string;
    const activeCardId = active.id as string;

    const isOverColumn = columns.some((c) => c.id === overId);
    let overColumnId: string;
    let beforeCardId: string | null = null;

    if (isOverColumn) {
      overColumnId = overId;
    } else {
      const overCol = columns.find((col) => col.cards.some((c) => c.id === overId));
      if (!overCol) { setDropTarget(null); return; }
      overColumnId = overCol.id;
      const activeCol = columns.find((col) => col.cards.some((c) => c.id === activeCardId));
      if (activeCol?.id === overColumnId) { setDropTarget(null); return; }
      beforeCardId = overId;
    }

    const activeCol = columns.find((col) => col.cards.some((c) => c.id === activeCardId));
    if (activeCol?.id === overColumnId) { setDropTarget(null); return; }

    setDropTarget({ columnId: overColumnId, beforeCardId });
  };

  const onDragEnd: typeof handleDragEnd = (event) => {
    setDropTarget(null);
    handleDragEnd(event);
    setActiveCard(null);
  };

  const columnProps = (col: typeof columns[0]) => ({
    id: col.id,
    boardId,
    title: col.title,
    cards: col.cards,
    onAddCard: handleAddCard,
    onDeleteCard: handleDeleteCard,
    onSaveCard: handleUpdateCard,
    onRenameColumn: handleRenameColumn,
    onDeleteColumn: handleDeleteColumn,
    filterAssigneeId,
    dropIndicatorBeforeId:
      dropTarget?.columnId === col.id ? dropTarget.beforeCardId : undefined,
  });

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div ref={boardScrollRef} className="board-scroll flex gap-6 overflow-x-auto overflow-y-hidden h-full  items-start snap-x snap-mandatory scroll-smooth">
        {todoColumns.map((col) => <KanbanColumn key={col.id} {...columnProps(col)} />)}
        {doneColumns.map((col) => <KanbanColumn key={col.id} {...columnProps(col)} />)}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? <DragPreview card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
