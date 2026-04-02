// components/my-tasks/TaskGroup.tsx
"use client";

import { MyTask } from "@/app/(project)/my-tasks/page";
import { TaskRow } from "./TaskRow";

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
    <div className="mb-8">
      {/* ส่วนหัวของกลุ่ม (เช่น "Overdue (เลยกำหนด)") */}
      <div className="flex items-center gap-2 mb-3 px-2">
        <h3 className={`text-sm font-bold ${headerColor}`}>{title}</h3>
        <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-500 rounded-full">
          {tasks.length}
        </span>
      </div>
      
      {/* ส่วนกรอบที่ครอบ TaskRow ทั้งหมดเอาไว้ */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {tasks.map((task) => (
          <TaskRow   
            key={task.id} 
            task={task} 
            onComplete={onCompleteTask} 
          />
        ))}
      </div>
    </div>
  );
}