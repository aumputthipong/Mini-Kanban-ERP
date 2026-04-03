import { useState } from "react";
import { Trash2 } from "lucide-react";
import type { Subtask } from "@/types/board"; // ปรับ path ให้ตรงกับโปรเจกต์ของคุณ

// กำหนด Props ที่ต้องรับมาจาก Component แม่
interface SubtaskItemProps {
  cardId: string;
  subtask: Subtask;
  onToggle: (cardId: string, subtaskId: string, currentStatus: boolean) => void;
  onUpdateTitle: (cardId: string, subtaskId: string, newTitle: string) => void;
  onDelete: (cardId: string, subtaskId: string) => void;
}

export function SubtaskItem({ cardId, subtask, onToggle, onUpdateTitle, onDelete }: SubtaskItemProps) {
  // ย้าย State การแก้ไขมาไว้ในนี้ แต่ละบรรทัดจะจัดการตัวเองได้อิสระ!
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);

  // ฟังก์ชันสำหรับบันทึก
  const handleSave = () => {
    // เซฟเฉพาะตอนที่ข้อความมีการเปลี่ยนแปลงจริงๆ และไม่เป็นค่าว่าง
    if (editTitle.trim() !== subtask.title && editTitle.trim() !== "") {
      onUpdateTitle(cardId, subtask.id, editTitle);
    } else {
      // ถ้าแก้เป็นค่าว่าง ให้ดึงค่าเดิมกลับมา
      setEditTitle(subtask.title);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors group relative">
      <input
        type="checkbox"
        checked={subtask.is_done}
        onChange={() => onToggle(cardId, subtask.id, subtask.is_done)}
        className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
      />

      {isEditing ? (
        <input
          autoFocus
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          className="flex-1 text-sm px-2 py-0.5 border border-blue-400 rounded outline-none"
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setEditTitle(subtask.title); // ยกเลิกการแก้ กลับไปใช้ชื่อเดิม
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <span
          onClick={() => setIsEditing(true)}
          className={`text-sm flex-1 cursor-text px-2 py-0.5 border border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm rounded transition-all ${
            subtask.is_done ? "line-through text-slate-400" : "text-slate-700"
          }`}
          title="Click to edit"
        >
          {subtask.title}
        </span>
      )}

      <button
        type="button"
        onClick={() => onDelete(cardId, subtask.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-all"
        title="Delete subtask"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}