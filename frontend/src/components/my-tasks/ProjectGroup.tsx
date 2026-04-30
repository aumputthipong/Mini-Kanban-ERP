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
    <section className="mb-5">
      <div className="flex items-center justify-between mb-1 px-1">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-2 h-2 rounded-full shrink-0 ${getAvatarColor(boardId)}`}
            aria-hidden
          />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
            {boardName}
          </h3>
          <span className="text-[11px] font-semibold text-slate-400">
            {tasks.length}
          </span>
        </div>

        <Link
          href={`/board/${boardId}`}
          className="flex items-center gap-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 transition-colors shrink-0"
        >
          Open
          <ArrowUpRight size={11} />
        </Link>
      </div>

      <div className="border-t border-slate-200">
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
