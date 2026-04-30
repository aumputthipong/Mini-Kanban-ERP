"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CheckSquare,
  Calendar,
  FolderKanban,
  Circle,
  Loader2,
} from "lucide-react";
import { apiClient } from "@/lib/apiClient";
import { TaskGroup } from "@/components/my-tasks/TaskGroup";
import { ProjectGroup } from "@/components/my-tasks/ProjectGroup";
import { TaskRow, type MyTask, type MyTaskStatus } from "@/components/my-tasks/TaskRow";

interface RawMyTask {
  id: string;
  title: string;
  board_id: string;
  board_name: string;
  priority: "low" | "medium" | "high" | null;
  due_date: string | null;
  estimated_hours: number | null;
  status: MyTaskStatus;
}

type ViewMode = "date" | "project";
type DateTab = "soon" | "overdue";

const SOON_WINDOW_DAYS = 7;

const TODAY = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
})();

const SOON_CUTOFF = (() => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + SOON_WINDOW_DAYS);
  return d;
})();

function dueBucket(t: MyTask): "overdue" | "soon" | "later" | "none" {
  if (!t.due_date) return "none";
  const due = new Date(t.due_date);
  due.setHours(0, 0, 0, 0);
  if (due < TODAY) return "overdue";
  if (due <= SOON_CUTOFF) return "soon";
  return "later";
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
  const [dateTab, setDateTab] = useState<DateTab>("soon");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await apiClient<RawMyTask[]>("/my-tasks");
        if (cancelled) return;
        setTasks(rows ?? []);
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
    const soon: MyTask[] = [];
    const later: MyTask[] = [];
    const noDueDate: MyTask[] = [];
    for (const t of tasks) {
      switch (dueBucket(t)) {
        case "overdue":
          overdue.push(t);
          break;
        case "soon":
          soon.push(t);
          break;
        case "later":
          later.push(t);
          break;
        default:
          noDueDate.push(t);
      }
    }
    return { overdue, soon, later, noDueDate };
  }, [tasks]);

  const statusCounts = useMemo(() => {
    let todo = 0;
    let inProgress = 0;
    for (const t of tasks) {
      if (t.status === "in_progress") inProgress += 1;
      else todo += 1;
    }
    return { todo, inProgress };
  }, [tasks]);

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
      const soonCount = sorted.filter((t) => dueBucket(t) === "soon").length;
      return {
        boardId,
        boardName: v.name,
        tasks: sorted,
        overdueCount,
        soonCount,
      };
    });
    groups.sort((a, b) => {
      if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
      if (a.soonCount !== b.soonCount) return b.soonCount - a.soonCount;
      return b.tasks.length - a.tasks.length;
    });
    return groups;
  }, [tasks]);

  const total = tasks.length;
  const showWidgets = !isLoading && !error && total > 0;

  return (
    <main className="h-full overflow-y-auto p-6 md:p-8 max-w-5xl mx-auto">
      {/* Title row — toggle on right */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <CheckSquare size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-slate-800 leading-tight">
            My Tasks
          </h1>
          <p className="text-xs text-slate-500">
            งานทั้งหมดที่คุณรับผิดชอบจากทุกโปรเจกต์
          </p>
        </div>
        {showWidgets && (
          <div className="inline-flex bg-slate-50 rounded-md border border-slate-200 p-0.5 text-[11px] shrink-0">
            <button
              type="button"
              onClick={() => setView("date")}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                view === "date"
                  ? "bg-white text-slate-700 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Calendar size={11} />
              By date
            </button>
            <button
              type="button"
              onClick={() => setView("project")}
              className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
                view === "project"
                  ? "bg-white text-slate-700 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FolderKanban size={11} />
              By project
            </button>
          </div>
        )}
      </div>

      {/* Compact horizontal summary cards */}
      {showWidgets && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatusCard
            label="Total"
            value={total}
            icon={<CheckSquare size={13} />}
            tone="slate"
          />
          <StatusCard
            label="To Do"
            value={statusCounts.todo}
            icon={<Circle size={13} />}
            tone="blue"
          />
          <StatusCard
            label="In Progress"
            value={statusCounts.inProgress}
            icon={<Loader2 size={13} />}
            tone="amber"
          />
        </div>
      )}

      {/* Date meta — single subtle line under summary */}
      {showWidgets && (
        <div className="flex items-center gap-3 mb-4 text-xs flex-wrap text-slate-500">
          {buckets.overdue.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              <span className="font-semibold text-rose-600">
                {buckets.overdue.length}
              </span>
              <span>overdue</span>
            </span>
          )}
          {buckets.soon.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="font-semibold text-amber-600">
                {buckets.soon.length}
              </span>
              <span>due soon</span>
            </span>
          )}
          {buckets.later.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
              <span className="font-semibold text-slate-700">
                {buckets.later.length}
              </span>
              <span>later</span>
            </span>
          )}
          {buckets.noDueDate.length > 0 && (
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              <span className="font-medium text-slate-500">
                {buckets.noDueDate.length}
              </span>
              <span>no date</span>
            </span>
          )}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-slate-400">Loading…</p>
      ) : error ? (
        <p className="text-sm text-rose-500">{error}</p>
      ) : total === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl">
          <p className="text-sm text-slate-500 font-medium">
            ไม่มีงานค้างอยู่ — ยินดีด้วย 🎉
          </p>
          <p className="text-xs text-slate-400 mt-1">
            งานที่ถูก assign ให้คุณจะมาโผล่ที่นี่
          </p>
        </div>
      ) : view === "date" ? (
        <div>
          {/* Tabs: Due soon vs Overdue */}
          <div className="flex items-center gap-1 mb-3 border-b border-slate-200">
            <DateTabButton
              active={dateTab === "soon"}
              onClick={() => setDateTab("soon")}
              label="Due soon"
              count={buckets.soon.length}
              activeColor="text-amber-600 border-amber-500"
            />
            <DateTabButton
              active={dateTab === "overdue"}
              onClick={() => setDateTab("overdue")}
              label="Overdue"
              count={buckets.overdue.length}
              activeColor="text-rose-600 border-rose-500"
            />
            <span className="ml-auto text-[11px] text-slate-400">
              Due soon = within {SOON_WINDOW_DAYS} days
            </span>
          </div>

          {dateTab === "soon" ? (
            buckets.soon.length === 0 ? (
              <div className="text-sm text-slate-400 py-6 px-1">
                ไม่มีงานใกล้กำหนดในช่วง {SOON_WINDOW_DAYS} วันข้างหน้า
              </div>
            ) : (
              <div className="border-t border-slate-200 mb-5">
                {buckets.soon.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onComplete={handleCompleteTask}
                  />
                ))}
              </div>
            )
          ) : buckets.overdue.length === 0 ? (
            <div className="text-sm text-slate-400 py-6 px-1">
              ไม่มีงานเลยกำหนด — ดีมาก 👍
            </div>
          ) : (
            <div className="border-t border-slate-200 mb-5">
              {buckets.overdue.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onComplete={handleCompleteTask}
                />
              ))}
            </div>
          )}

          {/* Always-visible secondary sections */}
          <TaskGroup
            title={`Later (>${SOON_WINDOW_DAYS} days)`}
            tasks={buckets.later}
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

// ─── StatusCard ───────────────────────────────────────────────────────────────

const TONE_STYLES = {
  slate: {
    bg: "bg-white border-slate-200",
    icon: "bg-slate-100 text-slate-600",
    label: "text-slate-500",
    value: "text-slate-800",
  },
  blue: {
    bg: "bg-white border-slate-200",
    icon: "bg-blue-50 text-blue-600",
    label: "text-slate-500",
    value: "text-slate-800",
  },
  amber: {
    bg: "bg-white border-slate-200",
    icon: "bg-amber-50 text-amber-600",
    label: "text-slate-500",
    value: "text-slate-800",
  },
} as const;

function DateTabButton({
  active,
  onClick,
  label,
  count,
  activeColor,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
  activeColor: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-2 -mb-px border-b-2 text-sm font-semibold transition-colors ${
        active
          ? activeColor
          : "border-transparent text-slate-400 hover:text-slate-600"
      }`}
    >
      {label}
      <span
        className={`text-[11px] font-bold tabular-nums px-1.5 rounded ${
          active
            ? "bg-slate-100 text-slate-700"
            : "bg-slate-100 text-slate-400"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function StatusCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  tone: keyof typeof TONE_STYLES;
}) {
  const t = TONE_STYLES[tone];
  return (
    <div className={`${t.bg} border rounded-lg px-3 py-2 flex items-center gap-2.5`}>
      <div
        className={`w-7 h-7 rounded-md ${t.icon} flex items-center justify-center shrink-0`}
      >
        {icon}
      </div>
      <span className={`text-xl font-bold tabular-nums leading-none ${t.value}`}>
        {value}
      </span>
      <span className={`flex-1 min-w-0 text-[11px] font-semibold uppercase tracking-wider truncate text-right ${t.label}`}>
        {label}
      </span>
    </div>
  );
}
