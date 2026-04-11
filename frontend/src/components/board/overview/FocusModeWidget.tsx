"use client";

import { Card } from "@/types/board";
import { formatDate } from "date-fns";
import { Plus, Target } from "lucide-react";
import { useRouter } from "next/navigation";

interface FocusModeWidgetProps {
  boardId: string;
  focusTasks: Card[];
  overdueCards: Card[];
  onSelectCard: (card: Card) => void;
  formatDate: (date: string) => string;
}
export function FocusModeWidget({
  boardId,
  focusTasks,
  overdueCards,
  onSelectCard,
  formatDate,
}: FocusModeWidgetProps) {
  const router = useRouter();
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <Target size={16} strokeWidth={2.5} />
          </div>
          <div>
            <span className="font-bold text-sm text-slate-800 tracking-wide">
              Focus Mode
            </span>
            <span className="text-sm text-slate-500 font-medium ml-1.5 hidden sm:inline-block">
              — Your Top 3 Right Now
            </span>
          </div>
        </div>
        <button
          onClick={() => router.push(`/board/${boardId}/tasks`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          New Task
        </button>
      </div>

      {focusTasks.length === 0 ? (
        <p className="text-sm text-slate-500 py-2 font-medium">
          No urgent tasks — you&apos;re on track!
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {focusTasks.map((card, i) => {
            // เช็ค overdue จาก props ที่ส่งเข้ามา
            const isOverdue = overdueCards.some((c) => c.id === card.id);
            return (
              <button
                key={card.id}
                onClick={() => onSelectCard(card)}
                className="text-left bg-slate-50/50 hover:bg-white hover:border-indigo-300 hover:shadow-md transition-all duration-200 rounded-lg p-3 flex flex-col gap-2 border border-slate-200 group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                    #{i + 1}
                  </span>
                  {isOverdue ? (
                    <span className="text-[10px] font-bold text-red-700 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                      OVERDUE
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded">
                      DUE SOON
                    </span>
                  )}
                </div>

                <p className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2 group-hover:text-indigo-600 transition-colors">
                  {card.title}
                </p>

                {card.due_date && (
                  <div className="mt-auto pt-1">
                    <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                      {formatDate(card.due_date)}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
