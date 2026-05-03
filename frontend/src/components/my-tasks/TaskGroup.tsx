// components/my-tasks/TaskGroup.tsx
"use client";

import { TaskRow, type MyTask } from "./TaskRow";

interface TaskGroupProps {
  title: string;
  tasks: MyTask[];
  dotColor?: string;
  onCompleteTask: (taskId: string, boardId: string) => void;
}

export function TaskGroup({
  title,
  tasks,
  dotColor = "bg-slate-400",
  onCompleteTask,
}: TaskGroupProps) {
  if (tasks.length === 0) return null;

  return (
    <section className="mb-3 last:mb-0">
      {/* Prominent header bar — matches ProjectGroup style */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-t-lg bg-linear-to-r from-slate-100 via-slate-50 to-transparent border border-slate-200 border-b-0">
        <span
          aria-hidden
          className={`w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white shadow-sm ${dotColor}`}
        />
        <h3 className="text-base font-bold text-slate-900 truncate tracking-tight">
          {title}
        </h3>
        <span className="text-[11px] font-bold tabular-nums text-slate-700 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-xs shrink-0">
          {tasks.length}
        </span>
      </div>

      <div className="border border-slate-200 border-t-slate-100 rounded-b-lg bg-white overflow-hidden">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} onComplete={onCompleteTask} />
        ))}
      </div>
    </section>
  );
}
