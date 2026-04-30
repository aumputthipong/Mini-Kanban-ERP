"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TaskRow, type MyTask } from "./TaskRow";
import { getAvatarColor } from "@/utils/avatar";

interface ProjectGroupProps {
  boardId: string;
  boardName: string;
  tasks: MyTask[];
  overdueCount: number;
  soonCount: number;
  onCompleteTask: (taskId: string, boardId: string) => void;
}

export function ProjectGroup({
  boardId,
  boardName,
  tasks,
  overdueCount,
  soonCount,
  onCompleteTask,
}: ProjectGroupProps) {
  if (tasks.length === 0) return null;

  const dotColor = getAvatarColor(boardId);

  return (
    <section className="mb-3 last:mb-0">
      {/* Prominent header bar */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-t-lg bg-linear-to-r from-slate-100 via-slate-50 to-transparent border border-slate-200 border-b-0">
        <span
          aria-hidden
          className={`w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white shadow-sm ${dotColor}`}
        />
        <h3 className="text-base font-bold text-slate-900 truncate tracking-tight">
          {boardName}
        </h3>
        <span className="text-[11px] font-bold tabular-nums text-slate-700 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-xs shrink-0">
          {tasks.length}
        </span>

        {overdueCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            {overdueCount} overdue
          </span>
        )}
        {soonCount > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            {soonCount} soon
          </span>
        )}

        <Link
          href={`/board/${boardId}/tasks`}
          className="ml-auto flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors shrink-0"
        >
          Open
          <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Tasks list with matching border */}
      <div className="border border-slate-200 border-t-slate-100 rounded-b-lg bg-white overflow-hidden">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={onCompleteTask}
            showBoardName={false}
          />
        ))}
      </div>
    </section>
  );
}
