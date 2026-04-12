"use client";

import { AlertCircle, AlertTriangle } from "lucide-react";
import type { Card } from "@/types/board";
import { getOverdueText, getDaysRemainingText } from "@/utils/date_helper";
import { FocusModeWidget } from "./FocusModeWidget";
import { formatThaiDate } from "@/utils/date_helper";

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

interface TasksTabContentProps {
  boardId: string;
  focusTasks: Card[];
  overdueCards: Card[];
  dueSoonCards: Card[];
  onSelectCard: (card: Card) => void;
}

export function TasksTabContent({
  boardId,
  focusTasks,
  overdueCards,
  dueSoonCards,
  onSelectCard,
}: TasksTabContentProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Focus Mode */}
      <FocusModeWidget
        boardId={boardId}
        focusTasks={focusTasks}
        overdueCards={overdueCards}
        onSelectCard={onSelectCard}
        formatDate={formatThaiDate}
      />

      {/* Overdue + Due Soon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Overdue */}
        <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-red-50 px-4 py-3 border-b border-red-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
              <AlertCircle size={15} /> Overdue
            </div>
            <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
              {overdueCards.length}
            </span>
          </div>
          {overdueCards.length === 0 ? (
            <p className="text-sm text-slate-400 p-4">ไม่มีงานที่เลยกำหนด</p>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {overdueCards.map((card) => (
                <li
                  key={card.id}
                  onClick={() => onSelectCard(card)}
                  className="p-3 text-sm flex justify-between items-center hover:bg-red-50 cursor-pointer group"
                >
                  <span className="flex items-center gap-2 font-medium text-slate-700 truncate pr-2">
                    <PriorityDot priority={card.priority} />
                    <span className="truncate group-hover:text-red-700">{card.title}</span>
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
              {dueSoonCards.length}
            </span>
          </div>
          {dueSoonCards.length === 0 ? (
            <p className="text-sm text-slate-400 p-4">ไม่มีงานที่กำลังจะครบ</p>
          ) : (
            <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {dueSoonCards.map((card) => (
                <li
                  key={card.id}
                  onClick={() => onSelectCard(card)}
                  className="p-3 text-sm flex justify-between items-center hover:bg-amber-50 cursor-pointer group"
                >
                  <span className="flex items-center gap-2 font-medium text-slate-700 truncate pr-2">
                    <PriorityDot priority={card.priority} />
                    <span className="truncate group-hover:text-amber-700">{card.title}</span>
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
    </div>
  );
}
