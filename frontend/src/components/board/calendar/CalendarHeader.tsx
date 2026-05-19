"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { format, isSameMonth } from "date-fns";

export type CalendarView = "day" | "week" | "month" | "agenda";

interface Props {
  currentDate: Date;
  today: Date;
  view: CalendarView;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (v: CalendarView) => void;
  onNewTask?: () => void;
}

const VIEWS: { key: CalendarView; label: string; enabled: boolean }[] = [
  { key: "day", label: "Day", enabled: false },
  { key: "week", label: "Week", enabled: false },
  { key: "month", label: "Month", enabled: true },
  { key: "agenda", label: "Agenda", enabled: false },
];

export function CalendarHeader({
  currentDate,
  today,
  view,
  onPrev,
  onNext,
  onToday,
  onViewChange,
  onNewTask,
}: Props) {
  const isViewingCurrentMonth = isSameMonth(currentDate, today);

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-baseline gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
          Today · {format(today, "d MMM")}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-md border border-slate-200 bg-white">
          <button
            type="button"
            onClick={onPrev}
            aria-label="Previous month"
            className="rounded-l-md p-1.5 hover:bg-slate-50"
          >
            <ChevronLeft size={16} className="text-slate-600" />
          </button>
          <button
            type="button"
            onClick={onToday}
            disabled={isViewingCurrentMonth}
            className="border-x border-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400 disabled:hover:bg-white"
          >
            Today
          </button>
          <button
            type="button"
            onClick={onNext}
            aria-label="Next month"
            className="rounded-r-md p-1.5 hover:bg-slate-50"
          >
            <ChevronRight size={16} className="text-slate-600" />
          </button>
        </div>

        <div role="tablist" className="flex rounded-md border border-slate-200 bg-white p-0.5">
          {VIEWS.map((v) => {
            const active = v.key === view;
            return (
              <button
                key={v.key}
                role="tab"
                aria-selected={active}
                disabled={!v.enabled}
                onClick={() => v.enabled && onViewChange(v.key)}
                title={v.enabled ? v.label : `${v.label} — coming soon`}
                className={`rounded px-3 py-1 text-xs font-medium transition-colors ${
                  active
                    ? "bg-slate-900 text-white"
                    : v.enabled
                      ? "text-slate-600 hover:bg-slate-50"
                      : "cursor-not-allowed text-slate-300"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>

        {onNewTask && (
          <button
            type="button"
            onClick={onNewTask}
            className="inline-flex items-center gap-1 rounded-md bg-blue-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-900"
          >
            <Plus size={14} />
            New Task
          </button>
        )}
      </div>
    </div>
  );
}
