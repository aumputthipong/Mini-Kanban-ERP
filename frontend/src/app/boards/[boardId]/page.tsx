"use client";

import { KanbanColumn } from "@/components/kanban/Column";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useBoardStore } from "@/store/useBoardStore";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { use, useEffect } from "react";
import { Kanban, DollarSign } from "lucide-react";

interface PageProps {
params: Promise<{
    boardId: string;
  }>;
}

export default function KanbanPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const boardId = resolvedParams.boardId;

  const { columns, setColumns,moveCard } = useBoardStore();
const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080/ws';
  const { sendMessage } = useWebSocket(`${wsUrl}/${boardId}`);

useEffect(() => {
    const fetchBoardData = async () => {
      try {
        // 2. นำ boardId ไปต่อท้าย URL ของ API
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
        const response = await fetch(`${apiUrl}/boards/${boardId}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setColumns(data);
      } catch (error) {
        console.error("Failed to fetch board data:", error);
      }
    };

    if (boardId) {
      fetchBoardData();
    }
  }, [boardId, setColumns]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return; // ถ้าลากไปปล่อยนอกบอร์ด ให้ยกเลิก

    const cardId = active.id as string;
    const newColumnId = over.id as string;

    // active.data คือข้อมูลที่เราแอบฝังไว้ในตัวการ์ดตอนทำ Draggable
    const oldColumnId = active.data.current?.currentColumnId;

    if (oldColumnId && newColumnId !== oldColumnId) {
      moveCard(cardId, oldColumnId, newColumnId);

      // คำนวณหาตำแหน่งใหม่แบบง่ายๆ (เอาไว้ต่อท้ายคอลัมน์)
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

      console.log(
        `Moved card ${cardId} to ${newColumnId} at position ${newPosition}`,
      );
    }
  };

  const addCard = (columnId: string) => {
    const title = prompt("Enter card title:");
    if (!title) return;

    // ส่งผ่าน WebSocket แทนการใช้ Fetch
    sendMessage({
      type: "CARD_CREATED",
      payload: {
        column_id: columnId,
        title: title
      }
    });
  };

  const handleDeleteCard = (cardId: string) => {
    // Best Practice: ถามเพื่อความแน่ใจก่อนลบเสมอ
    const isConfirmed = window.confirm("Are you sure you want to delete this task?");
    
    if (isConfirmed) {
      sendMessage({
        type: "CARD_DELETED",
        payload: {
          card_id: cardId
        }
      });
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8 flex items-center justify-between bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Kanban className="text-blue-600" />
            Mini ERP Kanban
          </h1>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100 flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-full text-white">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs text-green-700 font-medium uppercase">
              Budget Used
            </p>
            <p className="text-xl font-bold text-green-900">$100,000.00</p>
          </div>
        </div>
      </header>

      {/* DndContext เป็นตัวกลางตรวจจับการลากวางทั้งหมด */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {columns.map((col) => (
            <div key={col.id} className="flex flex-col">
              <button
                onClick={() => addCard(col.id)}
                className="mt-2 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg 
                     text-gray-500 hover:bg-gray-50 hover:border-gray-400 transition-all text-sm font-medium"
              >
                + Add Task
              </button>
              {" "}
              
              {/* เพิ่ม Wrapper เพื่อใส่ปุ่มข้างล่าง */}
              <KanbanColumn id={col.id} title={col.title} cards={col.cards}
              onDeleteCard={handleDeleteCard} />
              {/* ปุ่มเพิ่มการ์ดจะอยู่ท้ายคอลัมน์นั้นๆ */}
            </div>
          ))}
        </div>
      </DndContext>
    </main>
  );
}
