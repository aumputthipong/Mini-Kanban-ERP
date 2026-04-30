"use client";

import Link from "next/link";
import { Calendar, ChevronRight, Clock } from "lucide-react";
import { PriorityBadge } from "@/components/board/task-board/PriorityBadge";
import { formatRelativeDueDate, formatThaiDate } from "@/utils/date_helper";

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
  showBoardName?: boolean;
}

function dueDateTone(dueDateStr: string): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDateStr);
  due.setHours(0, 0, 0, 0);
  const diff = due.getTime() - today.getTime();
  if (diff < 0) return "text-rose-600 font-semibold";
  if (diff === 0) return "text-amber-600 font-semibold";
  return "text-slate-500";
}

export function TaskRow({ task, onComplete, showBoardName = true }: TaskRowProps) {
  const handleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onComplete(task.id, task.board_id);
  };

  return (
    <Link
      href={`/board/${task.board_id}`}
      className="group relative flex items-center gap-4 py-3 px-4 hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition-colors bg-white"
    >
      {/* Checkbox — completes; stops navigation */}
      <button
        type="button"
        onClick={handleComplete}
        className="w-5 h-5 shrink-0 rounded border border-slate-300 flex items-center justify-center hover:border-blue-500 hover:bg-blue-50 transition-colors"
        aria-label="Mark as complete"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-blue-500 opacity-0 group-hover:opacity-20 transition-opacity" />
      </button>

      {/* Title + board chip */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-800 truncate">
            {task.title}
          </span>
          {showBoardName && (
            <span className="px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-slate-100 rounded-md whitespace-nowrap">
              {task.board_name}
            </span>
          )}
        </div>
      </div>

      {/* Right meta */}
      <div className="flex items-center gap-3 shrink-0">
        {task.priority && <PriorityBadge priority={task.priority} />}

        {task.due_date && (
          <div
            className={`flex items-center gap-1 text-xs ${dueDateTone(task.due_date)}`}
            title={formatThaiDate(task.due_date)}
          >
            <Calendar size={12} />
            <span>{formatRelativeDueDate(task.due_date)}</span>
          </div>
        )}

        {task.estimated_hours != null && (
          <div className="flex items-center gap-1 text-xs font-medium text-slate-400 w-12 justify-end">
            <Clock size={12} />
            <span>{task.estimated_hours}h</span>
          </div>
        )}

        <ChevronRight
          size={14}
          className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity"
        />
      </div>
    </Link>
  );
}
