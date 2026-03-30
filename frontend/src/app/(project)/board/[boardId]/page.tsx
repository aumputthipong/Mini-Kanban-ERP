// app/(project)/board/[boardId]/page.tsx
"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useBoardStore } from "@/store/useBoardStore";
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { use, useEffect, useState } from "react";
import { Kanban, DollarSign, Move } from "lucide-react";
import { KanbanColumn } from "@/components/kanban/Column";

import { API_URL, WS_URL } from "@/lib/constants";
import { BoardHeader } from "@/components/kanban/BoardHeader";



interface PageProps {
  params: Promise<{ boardId: string }>;
}

export default function KanbanPage({ params }: PageProps) {
  const { boardId } = use(params);
  const { columns, setColumns, moveCard } = useBoardStore();
  const { sendMessage } = useWebSocket(`${WS_URL}/${boardId}`);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBoardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/boards/${boardId}`);
        if (!response.ok) {
          throw new Error(`Failed to load board (${response.status})`);
        }
        const data = await response.json();
        setColumns(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId, setColumns]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const cardId = active.id as string;
    const newColumnId = over.id as string;
    const oldColumnId = active.data.current?.currentColumnId;

    if (!oldColumnId || newColumnId === oldColumnId) return;

    moveCard(cardId, oldColumnId, newColumnId);

    const targetColumn = columns.find((c) => c.id === newColumnId);
    const newPosition = targetColumn ? targetColumn.cards.length + 1 : 1;

    sendMessage({
      type: "CARD_MOVED",
      payload: {
        card_id: cardId,
        old_column_id: oldColumnId,
        new_column_id: newColumnId,
        position: newPosition,
      },
    });
  };

const handleAddCard = (columnId: string, form: { title: string; due_date: string; assignee_id: string }) => {
  sendMessage({
    type: "CARD_CREATED",
    payload: {
      column_id: columnId,
      title: form.title,
      due_date: form.due_date || undefined,
      assignee_id: form.assignee_id || undefined,
    },
  });
};
  const handleDeleteCard = (cardId: string) => {
    sendMessage({
      type: "CARD_DELETED",
      payload: { card_id: cardId },
    });
  };
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // ต้องลากเมาส์ไป 5 พิกเซลก่อน ถึงจะถือว่าเป็นการ "ลาก" (Drag)
      },
    })
  );

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading board...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
 <main className="relative min-h-screen bg-[#fafafa]  p-8">
  {/* 1. Grid Background Layer (พื้นหลัง) 
    สำคัญ: ต้องมี pointer-events-none เพื่อไม่ให้มันไปขวางการคลิกเม้าส์และการลากการ์ด
  */}
  <div
    className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
    style={{
      backgroundImage: `linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)`,
      backgroundSize: "32px 32px",
    }}
  />

  {/* 2. Content Layer (เนื้อหาหลัก) ต้องมี relative และ z-10 เพื่อให้อยู่เหนือพื้นหลัง */}
  <div className="relative z-10">
  <BoardHeader title={`Project Board`} budgetUsed={100000} />

    <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div className="flex gap-6 overflow-x-auto pb-4 items-start">
        {columns.map((col) => (
          <KanbanColumn
            key={col.id}
            id={col.id}
            title={col.title}
            cards={col.cards}
            onAddCard={handleAddCard}
            onDeleteCard={handleDeleteCard}
          />
        ))}
      </div>
    </DndContext>
  </div>
</main>
  );
}