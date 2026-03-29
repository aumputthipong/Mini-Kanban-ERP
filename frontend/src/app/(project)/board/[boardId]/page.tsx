// app/(project)/board/[boardId]/page.tsx
"use client";

import { useWebSocket } from "@/hooks/useWebSocket";
import { useBoardStore } from "@/store/useBoardStore";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { use, useEffect, useState } from "react";
import { Kanban, DollarSign } from "lucide-react";
import { KanbanColumn } from "@/components/kanban/Column";
import type { Metadata } from "next";
import { title } from "process";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8080/ws";

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
    <main className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8 flex items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Kanban className="text-blue-600" />
          Mini ERP Kanban
        </h1>
        <div className="bg-green-50 p-4 rounded-xl border border-green-100 flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-full text-white">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-green-700 font-medium uppercase tracking-wider">
              Budget Used
            </p>
            <p className="text-xl font-bold text-green-900">$100,000.00</p>
          </div>
        </div>
      </header>

      <DndContext onDragEnd={handleDragEnd}>
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
    </main>
  );
}