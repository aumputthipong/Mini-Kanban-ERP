"use client";

import { Clock, Calendar } from "lucide-react";

// 1. กำหนดและ Export Interface ให้ไฟล์อื่นเรียกใช้ได้
export interface MyTask {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  estimated_hours: number | null;
  status: "todo" | "in_progress" | "done";
}

interface TaskRowProps {
  task: MyTask;
  onComplete: (taskId: string, boardId: string) => void;
}

export function TaskRow({ task, onComplete }: TaskRowProps) {
  // ฟังก์ชันช่วยกำหนดสีตาม Priority
  const getPriorityColor = (priority: MyTask["priority"]) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200";
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200";
      case "low":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      default:
        return "text-slate-500 bg-slate-50 border-slate-200";
    }
  };

  return (
    <div className="group flex items-center gap-4 py-3 px-4 hover:bg-slate-50 border-b border-slate-100 transition-colors bg-white last:border-b-0">
      
      {/* Checkbox */}
      <button
        onClick={() => onComplete(task.id, task.board_id)}
        className="w-5 h-5 shrink-0 rounded border border-slate-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
        aria-label="Mark as complete"
      >
        <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
      </button>

      {/* ข้อมูลหลัก (ชื่อ Task และ ชื่อ Board) */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-800 truncate">
            {task.title}
          </span>
          <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-md whitespace-nowrap">
            {task.board_name}
          </span>
        </div>
      </div>

      {/* ข้อมูลเสริม (Tags ด้านขวา) */}
      <div className="flex items-center gap-3 shrink-0">
        {task.priority && (
          <span
            className={`px-2 py-1 text-[10px] font-bold uppercase rounded border ${getPriorityColor(task.priority)}`}
          >
            {task.priority}
          </span>
        )}

        {task.due_date && (
          <div className="flex items-center gap-1 text-xs font-medium text-slate-500">
            <Calendar size={12} />
            <span>{task.due_date}</span>
          </div>
        )}

        {task.estimated_hours != null && (
          <div className="flex items-center gap-1 text-xs font-medium text-slate-400 w-12 justify-end">
            <Clock size={12} />
            <span>{task.estimated_hours}h</span>
          </div>
        )}
      </div>

    </div>
  );
}