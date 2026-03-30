// components/kanban/Card.tsx
"use client";

import { useDraggable } from "@dnd-kit/core";
import { Calendar, User, Trash2, Clock } from "lucide-react";
import type { Card } from "@/types/board";
import { useState } from "react";
import { CardDetailModal } from "./CardDetailModal";
import { Avatar } from "@mui/material";

interface CardProps {
  card: Card;
  onDelete: (cardId: string) => void;
}

export function TaskCard({ card, onDelete }: CardProps) {
 // State สำหรับควบคุมการเปิด/ปิด Modal
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: card.id,
      data: { currentColumnId: card.column_id },
    });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } // ใช้ translate3d เพื่อ Performance ที่ดีกว่า
    : undefined;

  const isOverdue = card.due_date && new Date(card.due_date) < new Date();

  // ฟังก์ชันช่วยจัดการสี Priority ในแบบ Tailwind (MUI Chip ก็ใช้ได้ แต่ในหน้า Board ใช้ Tailwind จะเบากว่า)
  const getPriorityClasses = (priority?: string) => {
    switch (priority) {
      case "high": return "bg-red-50 text-red-700 border-red-200";
      case "medium": return "bg-amber-50 text-amber-700 border-amber-200";
      case "low": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default: return "hidden";
    }
  };
  return (
   <>
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        // เมื่อคลิกที่ตัวการ์ด ให้เปิด Modal (dnd-kit จะแยกแยะการคลิกกับการลากให้ระดับหนึ่ง)
        onClick={() => setIsModalOpen(true)}
        className={`group relative bg-white p-4 rounded-xl border border-slate-200 flex flex-col gap-3
        ${
          isDragging
            ? "shadow-2xl opacity-80 rotate-2 cursor-grabbing z-50 ring-2 ring-blue-500" 
            : "shadow-sm cursor-grab hover:shadow-md hover:border-blue-300 transition-all duration-200" 
        }
      `}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1.5">
            {/* แสดง Priority ถ้ามี */}
            {card.priority && (
              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border w-fit ${getPriorityClasses(card.priority)}`}>
                {card.priority}
              </span>
            )}
            <p className="text-sm font-semibold text-slate-700 leading-snug">
              {card.title}
            </p>
          </div>

          <button
            // สำคัญ: ป้องกันไม่ให้การกดปุ่มถังขยะไปทริกเกอร์การลาก หรือการเปิด Modal
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation(); // หยุดไม่ให้ event คลิกทะลุไปถึง onClick ของ div หลัก
              onDelete(card.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-all shrink-0"
          >
            <Trash2 size={14} />
          </button>
        </div>

        {/* ส่วนข้อมูลด้านล่างของการ์ด */}
        <div className="flex items-end justify-between mt-1">
          <div className="flex flex-col gap-1.5">
            {card.due_date && (
              <span className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? "text-red-500" : "text-slate-500"}`}>
                <Calendar size={12} />
                {new Date(card.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
              </span>
            )}
            {card.estimated_hours && (
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <Clock size={12} />
                {card.estimated_hours}h
              </span>
            )}
          </div>

          {/* แสดง Avatar ของผู้รับผิดชอบด้วย MUI */}
          {card.assignee && (
            <Avatar 
              src={card.avatar_url || undefined} 
              sx={{ width: 24, height: 24, fontSize: 10, bgcolor: "#3b82f6", fontWeight: "bold" }}
              title={card.assignee}
            >
              {card.assignee.charAt(0).toUpperCase()}
            </Avatar>
          )}
        </div>
      </div>

      {/* เรนเดอร์ Modal เฉพาะตอนที่ถูกสั่งเปิด ช่วยประหยัดทรัพยากร */}
      {isModalOpen && (
        <CardDetailModal 
          card={card} 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </>
  );
}