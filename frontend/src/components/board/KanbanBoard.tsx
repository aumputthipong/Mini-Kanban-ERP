// components/board/KanbanBoard.tsx
import { DndContext, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { KanbanColumn } from "@/components/board/Column";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardActions } from "@/hooks/useBoardActions";

export function KanbanBoard({ boardId }: { boardId: string }) {
  const { columns } = useBoardStore();
  
  // โหลด Actions จาก Hook
  const { handleDragEnd, handleAddCard, handleDeleteCard, handleUpdateCard } = useBoardActions(boardId);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  return (
    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
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
    </DndContext>
  );
}