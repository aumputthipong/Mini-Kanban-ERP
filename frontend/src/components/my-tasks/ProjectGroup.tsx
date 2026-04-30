"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { TaskRow, type MyTask } from "./TaskRow";
import { getAvatarColor } from "@/utils/avatar";

interface ProjectGroupProps {
  boardId: string;
  boardName: string;
  tasks: MyTask[];
  onCompleteTask: (taskId: string, boardId: string) => void;
}

export function ProjectGroup({
  boardId,
  boardName,
  tasks,
  onCompleteTask,
}: ProjectGroupProps) {
  if (tasks.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full shrink-0 ${getAvatarColor(boardId)}`}
            aria-hidden
          />
          <h3 className="text-sm font-bold text-slate-800 truncate">
            {boardName}
          </h3>
          <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full shrink-0">
            {tasks.length}
          </span>
        </div>

        <Link
          href={`/board/${boardId}`}
          className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors shrink-0"
        >
          Open board
          <ArrowUpRight size={12} />
        </Link>
      </div>

      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
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
