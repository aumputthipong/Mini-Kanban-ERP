import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card as CardType } from '@/store/useBoardStore';
import { Trash2 } from 'lucide-react';

interface KanbanCardProps {
  card: CardType;
  onDelete: () => void;
}

export function KanbanCard({ card ,onDelete }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: card.id,
    data: {
      currentColumnId: card.column_id,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 100 : "auto",
  };

  return (
   <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      // เพิ่ม class 'group' และ 'relative' สำหรับจัดการ UI ถังขยะ
      className="group relative bg-white p-4 rounded-lg shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:border-blue-400 transition-colors"
    >
      {/* เพิ่ม pr-6 เพื่อเว้นที่ว่างด้านขวา ไม่ให้ข้อความทับปุ่มถังขยะ */}
      <p className="text-slate-800 font-medium pr-6">{card.title}</p>
      
      <button
        // สำคัญมากสำหรับ dnd-kit: ป้องกันไม่ให้การคลิกปุ่มกลายเป็นการลากการ์ด
        onPointerDown={(e) => e.stopPropagation()} 
        onClick={(e) => {
          e.stopPropagation(); // หยุด Event ซ้ำอีกชั้น
          onDelete(); // เรียกใช้ฟังก์ชันลบ
        }}
        className="absolute top-2 right-2 p-1 rounded-md text-slate-400 
                   hover:text-red-600 hover:bg-red-50 
                   opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}