"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckSquare, Calendar, FolderKanban } from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { TaskGroup } from "@/components/my-tasks/TaskGroup";
import { ProjectGroup } from "@/components/my-tasks/ProjectGroup";

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

interface RawMyTask {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  estimated_hours: number | null;
}

type ViewMode = "date" | "project";

const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

function dueBucket(t: MyTask): "overdue" | "today" | "upcoming" | "none" {
  if (!t.due_date) return "none";
  const due = new Date(t.due_date);
  due.setHours(0, 0, 0, 0);
  if (due < TODAY) return "overdue";
  if (due.getTime() === TODAY.getTime()) return "today";
  return "upcoming";
}

function compareDueDate(a: MyTask, b: MyTask): number {
  const aHas = a.due_date != null;
  const bHas = b.due_date != null;
  if (aHas && !bHas) return -1;
  if (!aHas && bHas) return 1;
  if (!aHas && !bHas) return 0;
  return new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime();
}

export default function MyTasksPage() {
  const [tasks, setTasks] = useState<MyTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("date");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiClient<RawMyTask[]>("/my-tasks");
        if (cancelled) return;
        setTasks((rows ?? []).map((r) => ({ ...r, status: "todo" as const })));
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
    const prev = tasks;
    setTasks((curr) => curr.filter((t) => t.id !== taskId));
    try {
      await apiClient(`/my-tasks/${taskId}/complete`, { method: "POST" });
    } catch (err) {
      setTasks(prev);
      setError(err instanceof Error ? err.message : "Failed to complete task");
    }
  };

  const buckets = useMemo(() => {
    const overdue: MyTask[] = [];
    const dueToday: MyTask[] = [];
    const upcoming: MyTask[] = [];
    const noDueDate: MyTask[] = [];
    for (const t of tasks) {
      switch (dueBucket(t)) {
        case "overdue":
          overdue.push(t);
          break;
        case "today":
          dueToday.push(t);
          break;
        case "upcoming":
          upcoming.push(t);
          break;
        default:
          noDueDate.push(t);
      }
    }
    return { overdue, dueToday, upcoming, noDueDate };
  }, [tasks]);

  // By-project grouping: tasks per board, sorted with overdue boards first.
  const projectGroups = useMemo(() => {
    const byBoard = new Map<string, { name: string; tasks: MyTask[] }>();
    for (const t of tasks) {
      const entry = byBoard.get(t.board_id);
      if (entry) entry.tasks.push(t);
      else byBoard.set(t.board_id, { name: t.board_name, tasks: [t] });
    }
    const groups = Array.from(byBoard.entries()).map(([boardId, v]) => {
      const sorted = [...v.tasks].sort(compareDueDate);
      const overdueCount = sorted.filter((t) => dueBucket(t) === "overdue").length;
      const todayCount = sorted.filter((t) => dueBucket(t) === "today").length;
      return {
        boardId,
        boardName: v.name,
        tasks: sorted,
        overdueCount,
        todayCount,
      };
    });
    groups.sort((a, b) => {
      if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
      if (a.todayCount !== b.todayCount) return b.todayCount - a.todayCount;
      return b.tasks.length - a.tasks.length;
    });
    return groups;
  }, [tasks]);

  return (
    <main className="h-full overflow-y-auto p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-200 pb-6">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
          <CheckSquare size={20} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-800">My Tasks</h1>
          <p className="text-sm text-slate-500 mt-1">
            งานทั้งหมดที่คุณรับผิดชอบจากทุกโปรเจกต์
          </p>
        </div>
      </div>

      {/* Stats + view toggle */}
      {!isLoading && !error && tasks.length > 0 && (
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            {buckets.overdue.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                {buckets.overdue.length} overdue
              </span>
            )}
            {buckets.dueToday.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                {buckets.dueToday.length} today
              </span>
            )}
            {buckets.upcoming.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-600 font-semibold border border-slate-200">
                {buckets.upcoming.length} upcoming
              </span>
            )}
            {buckets.noDueDate.length > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 text-slate-500 font-medium border border-slate-200">
                {buckets.noDueDate.length} no date
              </span>
            )}
          </div>

          <div className="inline-flex bg-slate-100 rounded-full p-0.5">
            <button
              type="button"
              onClick={() => setView("date")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                view === "date"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Calendar size={12} />
              By date
            </button>
            <button
              type="button"
              onClick={() => setView("project")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${
                view === "project"
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <FolderKanban size={12} />
              By project
            </button>
          </div>
        </div>
      )}

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
      ) : view === "date" ? (
        <div className="space-y-6">
          <TaskGroup
            title="Overdue (เลยกำหนด)"
            tasks={buckets.overdue}
            headerColor="text-rose-600"
            onCompleteTask={handleCompleteTask}
          />
          <TaskGroup
            title="Due Today (กำหนดส่งวันนี้)"
            tasks={buckets.dueToday}
            headerColor="text-amber-600"
            onCompleteTask={handleCompleteTask}
          />
          <TaskGroup
            title="Upcoming"
            tasks={buckets.upcoming}
            headerColor="text-slate-700"
            onCompleteTask={handleCompleteTask}
          />
          <TaskGroup
            title="No due date"
            tasks={buckets.noDueDate}
            headerColor="text-slate-500"
            onCompleteTask={handleCompleteTask}
          />
        </div>
      ) : (
        <div>
          {projectGroups.map((g) => (
            <ProjectGroup
              key={g.boardId}
              boardId={g.boardId}
              boardName={g.boardName}
              tasks={g.tasks}
              onCompleteTask={handleCompleteTask}
            />
          ))}
        </div>
      )}
    </main>
  );
}
