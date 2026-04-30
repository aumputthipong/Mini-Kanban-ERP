// components/my-tasks/TaskGroup.tsx
"use client";

import { TaskRow, type MyTask } from "./TaskRow";

// นำเข้า TaskRow และ Interface MyTask จากไฟล์ TaskRow ที่คุณสร้างไว้แล้ว


interface TaskGroupProps {
  title: string;
  tasks: MyTask[];
  headerColor?: string;
  onCompleteTask: (taskId: string, boardId: string) => void;
}

export function TaskGroup({ 
  title, 
  tasks, 
  headerColor = "text-slate-800", 
  onCompleteTask 
}: TaskGroupProps) {
  
  // Best Practice: ถ้าไม่มีงานในกลุ่มนี้เลย ก็ไม่ต้อง Render กล่องนี้ออกมาให้รกหน้าจอ
  if (tasks.length === 0) return null;

  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-1 px-1">
        <h3 className={`text-xs font-bold uppercase tracking-wider ${headerColor}`}>
          {title}
        </h3>
        <span className="text-[11px] font-semibold text-slate-400">
          {tasks.length}
        </span>
      </div>

      <div className="border-t border-slate-200">
        {tasks.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            onComplete={onCompleteTask}
          />
        ))}
      </div>
    </section>
  );
}