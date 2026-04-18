// components/board/KanbanBoard.tsx
"use client";

import { useState, useCallback } from "react";
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
import { KanbanColumn } from "@/components/board/task-board/Column";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardActions } from "@/hooks/useBoardActions";
import type { Card } from "@/types/board";
import { PriorityBadge } from "./PriorityBadge";

function DragPreview({ card }: { card: Card }) {
  return (
    <div className="p-4 rounded-xl border bg-white border-blue-400 shadow-2xl ring-2 ring-blue-500 rotate-2 opacity-95 w-72 cursor-grabbing">
      {card.priority && <PriorityBadge priority={card.priority} />}
      <p className="text-sm font-semibold text-slate-700 leading-snug">
        {card.title}
      </p>
    </div>
  );
}

export function KanbanBoard({ boardId }: { boardId: string }) {
  const { columns, filterAssigneeId, filterPriorities, filterTagIds } = useBoardStore();
  const {
    handleDragStart,
    handleDragEnd,
    handleAddCard,
    handleDeleteColumn,
    handleUpdateColumn,
    handleDeleteCard,
    handleUpdateCard,
  } = useBoardActions(boardId);

  const todoColumns = columns.filter((c) => c.category !== "DONE");
  const doneColumns = columns.filter((c) => c.category === "DONE");

  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    columnId: string;
    beforeCardId: string | null;
  } | null>(null);

  const stableHandleAddCard = useCallback(handleAddCard, [handleAddCard]);
  const stableHandleDeleteCard = useCallback(handleDeleteCard, [handleDeleteCard]);
  const stableHandleUpdateCard = useCallback(handleUpdateCard, [handleUpdateCard]);
  const stableHandleDeleteColumn = useCallback(handleDeleteColumn, [handleDeleteColumn]);
  const stableHandleUpdateColumn = useCallback(handleUpdateColumn, [handleUpdateColumn]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
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

    const isOverColumn = columns.some((c) => c.id === overId);
    let overColumnId: string;
    let beforeCardId: string | null = null;

    if (isOverColumn) {
      overColumnId = overId;
    } else {
      const overCol = columns.find((col) =>
        col.cards.some((c) => c.id === overId),
      );
      if (!overCol) {
        setDropTarget(null);
        return;
      }
      overColumnId = overCol.id;
      const activeCol = columns.find((col) =>
        col.cards.some((c) => c.id === activeCardId),
      );
      if (activeCol?.id === overColumnId) {
        setDropTarget(null);
        return;
      }
      beforeCardId = overId;
    }

    const activeCol = columns.find((col) =>
      col.cards.some((c) => c.id === activeCardId),
    );
    if (activeCol?.id === overColumnId) {
      setDropTarget(null);
      return;
    }

    setDropTarget({ columnId: overColumnId, beforeCardId });
  };

  const onDragEnd: typeof handleDragEnd = (event) => {
    setDropTarget(null);
    handleDragEnd(event);
    setActiveCard(null);
  };

  const columnProps = useCallback(
    (col: (typeof columns)[0]) => ({
      id: col.id,
      boardId,
      title: col.title,
      category: col.category,
      color: col.color,
      cards: col.cards,
      onAddCard: stableHandleAddCard,
      onDeleteCard: stableHandleDeleteCard,
      onSaveCard: stableHandleUpdateCard,
      onDeleteColumn: stableHandleDeleteColumn,
      onUpdateColumn: stableHandleUpdateColumn,
      filterAssigneeId,
      filterPriorities,
      filterTagIds,
      dropIndicatorBeforeId:
        dropTarget?.columnId === col.id ? dropTarget.beforeCardId : undefined,
    }),
    [
      boardId,
      stableHandleAddCard,
      stableHandleDeleteCard,
      stableHandleUpdateCard,
      stableHandleDeleteColumn,
      stableHandleUpdateColumn,
      filterAssigneeId,
      filterPriorities,
      filterTagIds,
      dropTarget,
      columns,
    ],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className="board-scroll flex gap-6 items-stretch min-h-full snap-x snap-mandatory">
        {todoColumns.map((col) => (
          <KanbanColumn key={col.id} {...columnProps(col)} />
        ))}
        {doneColumns.map((col) => (
          <KanbanColumn key={col.id} {...columnProps(col)} />
        ))}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? <DragPreview card={activeCard} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
