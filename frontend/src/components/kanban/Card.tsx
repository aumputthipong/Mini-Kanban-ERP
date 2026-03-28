import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card as CardType } from "@/store/useBoardStore";
import { MoreHorizontal, Trash2 } from "lucide-react";

interface KanbanCardProps {
  card: CardType;
  onDelete: () => void;
}

export function KanbanCard({ card, onDelete }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      data: {
        currentColumnId: card.column_id,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 50 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative bg-white p-5 rounded-2xl border border-transparent 
        ${
          isDragging
            ? "shadow-2xl opacity-90 rotate-2 cursor-grabbing" 
            : "shadow-sm cursor-grab hover:shadow-md hover:border-slate-200 transition-shadow duration-200" 
        }
      `}
    >
      {/* ส่วนบน: Tag สี และปุ่ม ... */}
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-500"></div>{" "}
          {/* จุดสีจำลอง */}
          <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">
            Development
          </span>
        </div>
        <button className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal size={16} />
        </button>
      </div>

      {/* ส่วนกลาง: หัวข้อและรายละเอียด */}
      <h4 className="text-slate-800 font-semibold mb-2 text-sm leading-tight pr-6">
        {card.title}
      </h4>
      <p className="text-xs text-slate-500 mb-4 line-clamp-3 leading-relaxed">
        {/* Mockup Description */}
        Modify typography and styling of text placed on 6 screens of the website
        design. Prepare a documentation.
      </p>

      {/* ส่วนล่าง: Avatars */}
      <div className="flex items-center">
        <div className="w-7 h-7 rounded-full bg-pink-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white z-10">
          ML
        </div>
        <div className="w-7 h-7 rounded-full bg-orange-400 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white -ml-2 z-0">
          AG
        </div>
      </div>

      {/* ปุ่มถังขยะ (ยังคงเก็บไว้ แต่จัดให้อยู่ตำแหน่งที่สวยงาม) */}
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        className="absolute bottom-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
        title="Delete task"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
