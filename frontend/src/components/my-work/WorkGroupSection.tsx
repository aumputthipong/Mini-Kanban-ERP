"use client";

import { AlertTriangle, Calendar, CalendarDays, Clock, Inbox } from "lucide-react";
import { WorkCardRow } from "./WorkCardRow";
import type { MyWorkCard, MyWorkGroup } from "@/types/myWork";

interface WorkGroupSectionProps {
  group: MyWorkGroup;
  cards: MyWorkCard[];
  onComplete: (cardId: string) => void;
  onSnooze: (cardId: string, dueDate: string) => void;
}

const GROUP_META: Record<
  MyWorkGroup,
  { title: string; iconBg: string; iconFg: string; icon: React.ReactNode; tone: "danger" | "warn" | "neutral" }
> = {
  overdue: {
    title: "เลยกำหนด",
    iconBg: "bg-rose-50",
    iconFg: "text-rose-600",
    icon: <AlertTriangle size={14} />,
    tone: "danger",
  },
  today: {
    title: "วันนี้",
    iconBg: "bg-amber-50",
    iconFg: "text-amber-600",
    icon: <Calendar size={14} />,
    tone: "warn",
  },
  this_week: {
    title: "สัปดาห์นี้",
    iconBg: "bg-blue-50",
    iconFg: "text-blue-600",
    icon: <CalendarDays size={14} />,
    tone: "neutral",
  },
  later: {
    title: "ภายหลัง",
    iconBg: "bg-slate-100",
    iconFg: "text-slate-600",
    icon: <Clock size={14} />,
    tone: "neutral",
  },
  no_date: {
    title: "ไม่มีวันที่",
    iconBg: "bg-slate-100",
    iconFg: "text-slate-500",
    icon: <Inbox size={14} />,
    tone: "neutral",
  },
};

export function WorkGroupSection({ group, cards, onComplete, onSnooze }: WorkGroupSectionProps) {
  if (cards.length === 0) return null;
  const meta = GROUP_META[group];

  return (
    <section className="mb-5 last:mb-0">
      <div className="flex items-center gap-2.5 mb-2 px-1">
        <span
          aria-hidden
          className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${meta.iconBg} ${meta.iconFg}`}
        >
          {meta.icon}
        </span>
        <h3
          className={`text-sm font-bold tracking-tight ${
            meta.tone === "danger"
              ? "text-rose-700"
              : meta.tone === "warn"
                ? "text-amber-700"
                : "text-slate-800"
          }`}
        >
          {meta.title}
        </h3>
        <span className="text-[11px] font-bold tabular-nums text-slate-500">
          {cards.length}
        </span>
      </div>

      <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
        {cards.map((card) => (
          <WorkCardRow
            key={card.id}
            card={card}
            onComplete={onComplete}
            onSnooze={onSnooze}
          />
        ))}
      </div>
    </section>
  );
}
