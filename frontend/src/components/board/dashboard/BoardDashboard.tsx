"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardActions } from "@/hooks/useBoardActions";
import {
  formatThaiDate,
  getDaysRemainingText,
  getOverdueText,
} from "@/utils/date_helper";
import {
  CardDetailModal,
  FormState,
} from "@/components/board/card-modal/CardDetailModal";
import type { Card } from "@/types/board";
import {
  AlertCircle,
  Clock,
  Zap,
  CheckCircle2,
  BarChart3,
  AlertTriangle,
  Plus,
  TrendingDown,
  Users,
  Activity,
  Target,
} from "lucide-react";
import { FocusModeWidget } from "../overview/FocusModeWidget";
import { BurndownChartWidget } from "../overview/BurndownChartWidget";
import PieChartWidget from "../overview/PieChartWidget";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PriorityDot = ({ priority }: { priority: Card["priority"] }) => {
  if (!priority) return null;
  const colors: Record<string, string> = {
    high: "bg-red-500",
    medium: "bg-amber-400",
    low: "bg-emerald-400",
  };
  return (
    <span
      title={priority}
      className={`inline-block w-2 h-2 rounded-full shrink-0 ${colors[priority] ?? "bg-slate-300"}`}
    />
  );
};

function computeCanEdit(
  card: Card,
  currentUserId: string,
  boardMembers: { user_id: string; role: string }[],
) {
  if (!currentUserId) return false;
  if (card.created_by === currentUserId) return true;
  if (card.assignee_id === currentUserId) return true;
  const member = boardMembers.find((m) => m.user_id === currentUserId);
  return member ? member.role === "owner" || member.role === "manager" : false;
}

// ─── Mock: Activity Stream ────────────────────────────────────────────────────
const MOCK_ACTIVITY = [
  {
    id: 1,
    actor: "Aumputthipong",
    action: "moved",
    target: "Fix login bug",
    dest: "Done",
    time: "2m ago",
    color: "bg-emerald-500",
  },
  {
    id: 2,
    actor: "Napatpong",
    action: "added",
    target: "Write API docs",
    dest: "To Do",
    time: "14m ago",
    color: "bg-blue-500",
  },
  {
    id: 3,
    actor: "Aumputthipong",
    action: "updated",
    target: "Deploy to staging",
    dest: "In Progress",
    time: "1h ago",
    color: "bg-violet-500",
  },
  {
    id: 4,
    actor: "Sirinapa",
    action: "commented on",
    target: "Design new dashboard",
    dest: "",
    time: "3h ago",
    color: "bg-rose-500",
  },
  {
    id: 5,
    actor: "Napatpong",
    action: "moved",
    target: "Code review PR #42",
    dest: "In Review",
    time: "5h ago",
    color: "bg-amber-500",
  },
];

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-5 max-w-6xl mx-auto pb-10 animate-pulse">
      <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-xl h-28" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-xl border border-slate-200 h-20"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 h-52"
          />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xl border border-slate-200 h-64" />
        <div className="bg-white rounded-xl border border-slate-200 h-64" />
      </div>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
export function SectionTitle({
  icon,
  label,
}: {
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="text-slate-400">{icon}</span>
      <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
        {label}
      </h3>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
interface BoardDashboardProps {
  boardId: string;
}

export function BoardDashboard({ boardId }: BoardDashboardProps) {
  const stats = useDashboardStats();
  const { isLoading, currentUserId, boardMembers, columns } = useBoardStore();
  const { handleUpdateCard, handleDeleteCard, handleAddSubtask } =
    useBoardActions(boardId);
  const router = useRouter();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  if (isLoading) return <DashboardSkeleton />;

  if (stats.totalCards === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 gap-4">
        <BarChart3 size={32} className="text-slate-300" />
        <p className="text-sm">
          No data to analyze. Add some tasks to your board.
        </p>
        <button
          onClick={() => router.push(`/board/${boardId}/tasks`)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Add Your First Task
        </button>
      </div>
    );
  }

  // ── Derived data ─────────────────────────────────────────────────────────────
  const doneCount = columns
    .flatMap((c) => c.cards)
    .filter((c) => c.is_done).length;

  // Status distribution for pie chart — group by column
  const pieData = stats.columnStats.map((col) => ({
    name: col.title,
    value: col.count,
    isDone: col.category === "DONE",
  }));

  // Focus Mode: top 3 urgent tasks for current user (overdue first, then dueSoon, else assigned)
  const urgentForUser = [
    ...stats.overdueCards.filter((c) => c.assignee_id === currentUserId),
    ...stats.dueSoonCards.filter((c) => c.assignee_id === currentUserId),
  ].slice(0, 3);
  const focusTasks =
    urgentForUser.length > 0
      ? urgentForUser
      : [...stats.overdueCards, ...stats.dueSoonCards].slice(0, 3);

  return (
    <>
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          boardId={boardId}
          isOpen={true}
          onClose={() => setSelectedCard(null)}
          onUpdated={(cardId, form: FormState) => {
            handleUpdateCard(cardId, form);
            setSelectedCard(null);
          }}
          onDelete={(cardId) => {
            handleDeleteCard(cardId);
            setSelectedCard(null);
          }}
          onAddSubtask={handleAddSubtask}
          canEdit={computeCanEdit(selectedCard, currentUserId, boardMembers)}
        />
      )}

      <div className="flex flex-col gap-5 max-w-6xl mx-auto pb-10">
        {/* ── Row 1: Focus Mode ─────────────────────────────────────────────── */}
        <FocusModeWidget
          boardId={boardId}
          focusTasks={focusTasks}
          overdueCards={stats.overdueCards}
          onSelectCard={setSelectedCard}
          formatDate={formatThaiDate}
        />

        {/* ── Row 2: Stats strip ────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-emerald-50 rounded-lg">
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">
                {stats.progress}%
              </p>
              <p className="text-xs text-slate-400 font-medium">Completion</p>
            </div>
            {/* mini progress bar */}
            <div className="flex-1 bg-slate-100 h-1.5 rounded-full ml-auto overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all"
                style={{ width: `${stats.progress}%` }}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <BarChart3 size={20} className="text-blue-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">
                {stats.totalCards}
              </p>
              <p className="text-xs text-slate-400 font-medium">Total Tasks</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-sm font-bold text-slate-600">{doneCount}</p>
              <p className="text-[10px] text-slate-400">done</p>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-2.5 bg-violet-50 rounded-lg">
              <Clock size={20} className="text-violet-500" />
            </div>
            <div>
              <p className="text-2xl font-extrabold text-slate-800">
                {stats.totalHours}
              </p>
              <p className="text-xs text-slate-400 font-medium">Est. Hours</p>
            </div>
          </div>
        </div>

        {/* ── Row 3: Charts ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Status Distribution (Pie) */}
          <PieChartWidget columnStats={stats.columnStats} />
          {/* Burndown Chart */}
          <BurndownChartWidget
            totalCards={stats.totalCards}
            doneCount={doneCount}
          />
        </div>

        {/* ── Row 4: Needs Attention + Activity Stream ──────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Overdue + Due Soon */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            <SectionTitle
              icon={<AlertCircle size={15} />}
              label="Needs Attention"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Overdue */}
              <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-red-50 px-4 py-3 border-b border-red-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                    <AlertCircle size={15} /> Overdue
                  </div>
                  <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {stats.overdueCards.length}
                  </span>
                </div>
                {stats.overdueCards.length === 0 ? (
                  <p className="text-sm text-slate-400 p-4">
                    ไม่มีงานที่เลยกำหนด
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {stats.overdueCards.map((card) => (
                      <li
                        key={card.id}
                        onClick={() => setSelectedCard(card)}
                        className="p-3 text-sm flex justify-between items-center hover:bg-red-50 cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium text-slate-700 truncate pr-2">
                          <PriorityDot priority={card.priority} />
                          <span className="truncate group-hover:text-red-700">
                            {card.title}
                          </span>
                        </span>
                        <span className="text-red-600 text-xs font-bold whitespace-nowrap shrink-0">
                          {getOverdueText(card.due_date!)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Due Soon */}
              <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
                <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                    <AlertTriangle size={15} /> Due in 48h
                  </div>
                  <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                    {stats.dueSoonCards.length}
                  </span>
                </div>
                {stats.dueSoonCards.length === 0 ? (
                  <p className="text-sm text-slate-400 p-4">
                    ไม่มีงานที่กำลังจะครบ
                  </p>
                ) : (
                  <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {stats.dueSoonCards.map((card) => (
                      <li
                        key={card.id}
                        onClick={() => setSelectedCard(card)}
                        className="p-3 text-sm flex justify-between items-center hover:bg-amber-50 cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium text-slate-700 truncate pr-2">
                          <PriorityDot priority={card.priority} />
                          <span className="truncate group-hover:text-amber-700">
                            {card.title}
                          </span>
                        </span>
                        <span className="text-amber-600 text-xs font-bold whitespace-nowrap shrink-0">
                          {getDaysRemainingText(card.due_date!)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Team Workload */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users size={15} className="text-slate-400" />
                <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                  Team Workload
                </h3>
              </div>
              {stats.workload.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No active tasks assigned.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {stats.workload.map((user, index) => {
                    const maxCount = stats.workload[0].count;
                    const barWidth = Math.max(
                      8,
                      Math.round((user.count / maxCount) * 100),
                    );
                    const isHeavy = user.count >= 5;
                    return (
                      <div key={index} className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700 truncate">
                            {user.name}
                          </span>
                          <span
                            className={`font-bold text-xs ${isHeavy ? "text-red-500" : "text-slate-500"}`}
                          >
                            {user.count} tasks{isHeavy ? " ⚠️" : ""}
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isHeavy ? "bg-red-400" : "bg-blue-400"}`}
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Activity Stream (mock) + Smart Insights */}
          <div className="flex flex-col gap-4">
            {/* Smart Insights */}
            <div className="bg-white border border-slate-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={15} className="text-indigo-600 fill-indigo-500" />
                <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide">
                  Insights
                </h3>
              </div>
              <ul className="space-y-2.5">
                {stats.insights.map((insight, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-xs text-indigo-900"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Activity Stream */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={15} className="text-slate-400" />
                  <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
                    Activity
                  </h3>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">
                  Mock
                </span>
              </div>
              <ul className="space-y-3">
                {MOCK_ACTIVITY.map((event) => (
                  <li key={event.id} className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full ${event.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5`}
                    >
                      {event.actor[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-700 leading-snug">
                        <span className="font-semibold">{event.actor}</span>{" "}
                        {event.action}{" "}
                        <span className="font-medium text-slate-800">
                          &ldquo;{event.target}&rdquo;
                        </span>
                        {event.dest && (
                          <>
                            {" "}
                            →{" "}
                            <span className="text-indigo-600 font-medium">
                              {event.dest}
                            </span>
                          </>
                        )}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {event.time}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
