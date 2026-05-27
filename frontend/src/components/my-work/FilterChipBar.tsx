"use client";

import { AlertTriangle, Calendar, CalendarDays, Inbox, ListChecks } from "lucide-react";
import type { MyWorkCounts, MyWorkFilter } from "@/types/myWork";

interface FilterChipBarProps {
  active: MyWorkFilter;
  counts: MyWorkCounts;
  onChange: (next: MyWorkFilter) => void;
}

interface ChipDef {
  key: MyWorkFilter;
  label: string;
  count: number;
  icon: React.ReactNode;
  activeClass: string;
}

export function FilterChipBar({ active, counts, onChange }: FilterChipBarProps) {
  const chips: ChipDef[] = [
    {
      key: "all",
      label: "ทั้งหมด",
      count: counts.total,
      icon: <ListChecks size={12} />,
      activeClass: "bg-slate-900 text-white border-slate-900",
    },
    {
      key: "overdue",
      label: "เลยกำหนด",
      count: counts.overdue,
      icon: <AlertTriangle size={12} />,
      activeClass: "bg-rose-50 text-rose-700 border-rose-200",
    },
    {
      key: "today",
      label: "วันนี้",
      count: counts.today,
      icon: <Calendar size={12} />,
      activeClass: "bg-amber-50 text-amber-700 border-amber-200",
    },
    {
      key: "this_week",
      label: "สัปดาห์นี้",
      count: counts.this_week,
      icon: <CalendarDays size={12} />,
      activeClass: "bg-blue-50 text-blue-700 border-blue-200",
    },
    {
      key: "no_date",
      label: "ไม่มีวันที่",
      count: counts.no_date,
      icon: <Inbox size={12} />,
      activeClass: "bg-slate-100 text-slate-700 border-slate-300",
    },
  ];

  return (
    <div className="flex items-center gap-2 flex-wrap" role="tablist">
      {chips.map((c) => {
        const isActive = active === c.key;
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(c.key)}
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold transition-colors ${
              isActive
                ? c.activeClass
                : "bg-white text-slate-500 border-slate-200 hover:text-slate-700 hover:border-slate-300"
            }`}
          >
            {c.icon}
            <span>{c.label}</span>
            <span
              className={`tabular-nums text-[11px] px-1.5 rounded-md ${
                isActive ? "bg-white/20" : "bg-slate-100 text-slate-500"
              }`}
            >
              {c.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
