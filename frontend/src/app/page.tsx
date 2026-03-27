"use client";

import { KanbanColumn } from '@/components/kanban/Column';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useBoardStore } from '@/store/useBoardStore';
import { DndContext, DragEndEvent } from '@dnd-kit/core';
import { useEffect } from 'react';
import { Kanban, DollarSign } from 'lucide-react';


export default function KanbanPage() {
  const { columns, setColumns, moveCard } = useBoardStore();
  const { sendMessage } = useWebSocket('ws://127.0.0.1:8080/ws');


useEffect(() => {
    const fetchBoardData = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/boards/');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Data from Go Backend:", data);

        // ยัดข้อมูลที่ Go ส่งมา ลง Store ได้เลย!
        // แค่บรรทัดเดียวจบ เพราะ Go เตรียมมาให้ดีแล้ว
        setColumns(data);

      } catch (error) {
        console.error("Failed to fetch board data:", error);
      }
    };

    fetchBoardData();
  }, [setColumns]);
 

 const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return; // ถ้าลากไปปล่อยนอกบอร์ด ให้ยกเลิก

    const cardId = active.id as string;
    const newColumnId = over.id as string;
    
    // active.data คือข้อมูลที่เราแอบฝังไว้ในตัวการ์ดตอนทำ Draggable
    const oldColumnId = active.data.current?.currentColumnId;

    if (oldColumnId && newColumnId !== oldColumnId) {
      // 1. Optimistic Update: สั่งให้ UI หน้าจอเปลี่ยนทันที
      moveCard(cardId, oldColumnId, newColumnId);

      // 2. ส่งข้อมูลผ่าน WebSocket ไปให้ Go เพื่อบันทึกลง Database
      sendMessage({
        type: "CARD_MOVED",
        payload: {
          card_id: cardId,
          new_column_id: newColumnId,
          // ในระบบจริงเราจะส่ง position (ลำดับ) ไปด้วย
        }
      });
      
      console.log(`Successfully moved card ${cardId} to ${newColumnId}`);
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
          <div className="bg-green-500 p-2 rounded-full text-white"><DollarSign size={20} /></div>
          <div>
            <p className="text-xs text-green-700 font-medium uppercase">Budget Used</p>
            <p className="text-xl font-bold text-green-900">$100,000.00</p>
          </div>
        </div>
      </header>

      {/* DndContext เป็นตัวกลางตรวจจับการลากวางทั้งหมด */}
      <DndContext onDragEnd={handleDragEnd}>
        <div className="flex gap-6 overflow-x-auto pb-4">
        {columns.map((col) => (
          <KanbanColumn key={col.id} id={col.id} title={col.title} cards={col.cards} />
        ))}
        </div>
      </DndContext>
    </main>
  );
}
