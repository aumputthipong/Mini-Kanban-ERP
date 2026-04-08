"use client";

import { useState, useEffect } from "react";
import { CheckSquare } from "lucide-react";
// import type { MyTask } from "@/types/my-task"; // ถ้าแยกไฟล์ type แล้วค่อยเปิดคอมเมนต์นี้
import { API_URL } from "@/lib/constants";
import { TaskGroup } from "@/components/my-tasks/TaskGroup";

// เอา MyTask Interface มาไว้ที่นี่ชั่วคราวก่อนก็ได้ครับ ถ้ายังไม่ได้แยกไฟล์
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

// สังเกตตรงนี้ครับ ต้องเป็น export default 
export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const mockTasks: MyTask[] = [
      {
        id: "1",
        title: "แก้ไขบั๊กหน้า Login",
        board_id: "b1",
        board_name: "Mini ERP Project",
        priority: "high",
        due_date: "2026-03-31", 
        estimated_hours: 2,
        status: "todo",
      },
      {
        id: "2",
        title: "สรุป Requirement ให้ลูกค้า",
        board_id: "b2",
        board_name: "Client A",
        priority: "medium",
        due_date: new Date().toISOString().split("T")[0], 
        estimated_hours: 1,
        status: "todo",
      }
    ];
    
    setTasks(mockTasks);
    setIsLoading(false);
  }, []);

  const handleCompleteTask = async (taskId: string, boardId: string) => {
    // ลบการ์ดที่กดเสร็จแล้วออกจากหน้าจอ (Optimistic UI)
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  });

  const dueTodayTasks = tasks.filter((t) => {
    if (!t.due_date) return false;
    const dueDate = new Date(t.due_date);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate.getTime() === today.getTime();
  });

  if (isLoading) return <div className="p-8">Loading...</div>;

  return (
    <main className="h-full overflow-y-auto p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <CheckSquare size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">งานทั้งหมดที่คุณรับผิดชอบจากทุกโปรเจกต์</p>
        </div>
      </div>

      <div className="space-y-6">
        <TaskGroup 
          title="Overdue (เลยกำหนด)" 
          tasks={overdueTasks} 
          headerColor="text-red-600"
          onCompleteTask={handleCompleteTask} 
        />
        <TaskGroup 
          title="Due Today (กำหนดส่งวันนี้)" 
          tasks={dueTodayTasks} 
          headerColor="text-amber-600"
          onCompleteTask={handleCompleteTask} 
        />
      </div>
    </main>
  );
}