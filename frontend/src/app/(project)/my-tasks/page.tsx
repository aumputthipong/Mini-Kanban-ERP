"use client";

import { useEffect, useState } from "react";
import { CheckSquare } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { TaskGroup } from "@/components/my-tasks/TaskGroup";

export interface MyTask {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  estimated_hours: number | null;
  // status field is no longer returned by the API — kept here for back-compat
  // with existing components that expect it. We always treat list items as
  // "todo" since the API only returns undone cards.
  status: "todo" | "in_progress" | "done";
}

interface RawMyTask {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  estimated_hours: number | null;
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiClient<RawMyTask[]>("/my-tasks");
        if (cancelled) return;
        setTasks(
          (rows ?? []).map((r) => ({ ...r, status: "todo" as const })),
        );
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load tasks");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCompleteTask = async (taskId: string, _boardId: string) => {
    void _boardId;
    // Optimistic remove — re-add on failure.
    const prev = tasks;
    setTasks((curr) => curr.filter((t) => t.id !== taskId));
    try {
      await apiClient(`/my-tasks/${taskId}/complete`, { method: "POST" });
    } catch (err) {
      setTasks(prev);
      setError(err instanceof Error ? err.message : "Failed to complete task");
    }
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue: MyTask[] = [];
  const dueToday: MyTask[] = [];
  const upcoming: MyTask[] = [];
  const noDueDate: MyTask[] = [];

  for (const t of tasks) {
    if (!t.due_date) {
      noDueDate.push(t);
      continue;
    }
    const due = new Date(t.due_date);
    due.setHours(0, 0, 0, 0);
    if (due < today) overdue.push(t);
    else if (due.getTime() === today.getTime()) dueToday.push(t);
    else upcoming.push(t);
  }

  return (
    <main className="h-full overflow-y-auto p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8 border-b border-slate-200 pb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <CheckSquare size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            งานทั้งหมดที่คุณรับผิดชอบจากทุกโปรเจกต์
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-rose-500">{error}</p>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl">
          <p className="text-sm text-slate-500 font-medium">
            ไม่มีงานค้างอยู่ — ยินดีด้วย 🎉
          </p>
          <p className="text-xs text-slate-400 mt-1">
            งานที่ถูก assign ให้คุณจะมาโผล่ที่นี่
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <TaskGroup
            title="Overdue (เลยกำหนด)"
            tasks={overdue}
            headerColor="text-red-600"
            onCompleteTask={handleCompleteTask}
          />
          <TaskGroup
            title="Due Today (กำหนดส่งวันนี้)"
            tasks={dueToday}
            headerColor="text-amber-600"
            onCompleteTask={handleCompleteTask}
          />
          <TaskGroup
            title="Upcoming"
            tasks={upcoming}
            headerColor="text-slate-700"
            onCompleteTask={handleCompleteTask}
          />
          <TaskGroup
            title="No due date"
            tasks={noDueDate}
            headerColor="text-slate-500"
            onCompleteTask={handleCompleteTask}
          />
        </div>
      )}
    </main>
  );
}
