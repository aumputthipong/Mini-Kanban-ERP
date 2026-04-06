"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useBoardStore } from "@/store/useBoardStore";
import { useBoardActions } from "@/hooks/useBoardActions";
import { formatThaiDate, getDaysRemainingText, getOverdueText } from "@/ีutils/date_helper";
import { CardDetailModal, FormState } from "@/components/board/card-modal/CardDetailModal";
import type { Card } from "@/types/board";
import {
  AlertCircle,
  Clock,
  Zap,
  CheckCircle2,
  BarChart3,
  AlertTriangle,
  Plus,
  Layers,
} from "lucide-react";

// ─── Priority dot ──────────────────────────────────────────────────────────────
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

// ─── Skeleton loading ──────────────────────────────────────────────────────────
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10 animate-pulse">
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl h-28" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 h-28" />
        ))}
      </div>
      <div className="bg-white border border-slate-200 rounded-xl h-24" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 h-64" />
        <div className="bg-white rounded-xl border border-slate-200 h-64" />
      </div>
    </div>
  );
}

// ─── canEdit helper (mirrors useCanEdit but for arbitrary card) ────────────────
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

// ─── Main component ────────────────────────────────────────────────────────────
interface BoardDashboardProps {
  boardId: string;
}

export function BoardDashboard({ boardId }: BoardDashboardProps) {
  const stats = useDashboardStats();
  const { isLoading, currentUserId, boardMembers } = useBoardStore();
  const { handleUpdateCard, handleDeleteCard, handleAddSubtask } = useBoardActions(boardId);
  const router = useRouter();

  const [selectedCard, setSelectedCard] = useState<Card | null>(null);

  if (isLoading) return <DashboardSkeleton />;

  if (stats.totalCards === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50 gap-4">
        <BarChart3 size={32} className="text-slate-300" />
        <p>No data to analyze. Add some tasks to your board.</p>
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

  return (
    <>
      {/* ── Card Detail Modal ─────────────────────────────────────────────────── */}
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

      <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">

        {/* 1. Smart Insights */}
        <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-indigo-800">
              <Zap size={20} className="fill-indigo-600" />
              <h2 className="text-lg font-bold">Smart Insights</h2>
            </div>
            <button
              onClick={() => router.push(`/board/${boardId}/tasks`)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <Plus size={13} />
              Create Task
            </button>
          </div>
          <ul className="space-y-3">
            {stats.insights.map((insight, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-sm font-medium text-indigo-900"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>

        {/* 2. Project Health */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <h3 className="text-sm font-semibold">Project Progress</h3>
              <CheckCircle2 size={16} className="text-emerald-500" />
            </div>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-extrabold text-slate-800">{stats.progress}%</p>
              <p className="text-sm text-slate-400 mb-1">Completed</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <h3 className="text-sm font-semibold">Total Estimated Hours</h3>
              <Clock size={16} className="text-blue-500" />
            </div>
            <div className="flex items-end gap-2">
              <p className="text-4xl font-extrabold text-slate-800">{stats.totalHours}</p>
              <p className="text-sm text-slate-400 mb-1">Hours</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <h3 className="text-sm font-semibold">Total Tasks</h3>
              <BarChart3 size={16} className="text-slate-400" />
            </div>
            <p className="text-4xl font-extrabold text-slate-800">{stats.totalCards}</p>
          </div>
        </div>

        {/* 3. Bottleneck Analysis */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5">
          <div className="flex items-center gap-2 text-slate-700 mb-4">
            <Layers size={16} className="text-slate-500" />
            <h3 className="text-sm font-bold">Tasks per Column (Bottleneck Analysis)</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {stats.columnStats.map((col) => {
              const isDone = col.category === "DONE";
              return (
                <div
                  key={col.id}
                  className={`flex flex-col items-center px-4 py-3 rounded-lg border min-w-[90px] ${
                    isDone
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : col.count >= 10
                      ? "bg-red-50 border-red-200 text-red-800"
                      : col.count >= 5
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="text-2xl font-extrabold">{col.count}</span>
                  <span className="text-[11px] font-medium mt-0.5 text-center leading-tight">
                    {col.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Actionable Items & Workload */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2">
              Needs Attention
            </h3>

            {/* Due Soon */}
            <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                  <AlertTriangle size={16} /> Due Soon Tasks
                </div>
                <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {stats.dueSoonCards.length}
                </span>
              </div>
              <div className="p-0">
                {stats.dueSoonCards.length === 0 ? (
                  <p className="text-sm text-slate-400 p-4">ไม่มีงานที่กำลังจะถึงกำหนด</p>
                ) : (
                  <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {stats.dueSoonCards.map((card) => (
                      <li
                        key={card.id}
                        onClick={() => setSelectedCard(card)}
                        className="p-3 text-sm flex justify-between items-center hover:bg-amber-50 cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium text-slate-700 truncate pr-4">
                          <PriorityDot priority={card.priority} />
                          <span className="truncate group-hover:text-amber-700">{card.title}</span>
                        </span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-amber-600 text-xs font-bold whitespace-nowrap">
                            {getDaysRemainingText(card.due_date!)}
                          </span>
                          <span className="text-slate-400 text-[10px] whitespace-nowrap">
                            {formatThaiDate(card.due_date!)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Overdue */}
            <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-red-50 px-4 py-3 border-b border-red-200 flex items-center justify-between">
                <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                  <AlertCircle size={16} /> Overdue Tasks
                </div>
                <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                  {stats.overdueCards.length}
                </span>
              </div>
              <div className="p-0">
                {stats.overdueCards.length === 0 ? (
                  <p className="text-sm text-slate-400 p-4">ไม่มีงานที่เลยกำหนด</p>
                ) : (
                  <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                    {stats.overdueCards.map((card) => (
                      <li
                        key={card.id}
                        onClick={() => setSelectedCard(card)}
                        className="p-3 text-sm flex justify-between items-center hover:bg-red-50 cursor-pointer group"
                      >
                        <span className="flex items-center gap-2 font-medium text-slate-700 truncate pr-4">
                          <PriorityDot priority={card.priority} />
                          <span className="truncate group-hover:text-red-700">{card.title}</span>
                        </span>
                        <div className="flex flex-col items-end shrink-0">
                          <span className="text-red-600 text-xs font-bold whitespace-nowrap">
                            {getOverdueText(card.due_date!)}
                          </span>
                          <span className="text-slate-400 text-[10px] whitespace-nowrap">
                            {formatThaiDate(card.due_date!)}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Active Workload */}
          <div className="flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2">
              Active Workload
            </h3>
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
              {stats.workload.length === 0 ? (
                <p className="text-sm text-slate-400">No active tasks assigned to anyone.</p>
              ) : (
                <ul className="space-y-4">
                  {stats.workload.map((user, index) => {
                    const maxCount = stats.workload[0].count;
                    const barWidth = Math.max(10, Math.round((user.count / maxCount) * 100));
                    return (
                      <li key={index} className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-slate-700">{user.name}</span>
                          <span className="text-slate-500 font-semibold">{user.count} tasks</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
