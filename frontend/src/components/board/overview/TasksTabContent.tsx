"use client";

import { useMemo, useState } from "react";
import {
  AlarmClock,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Plus,
  Sparkles,
  User,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { Card } from "@/types/board";
import { useBoardStore } from "@/store/useBoardStore";
import { UrgentTaskRow } from "./UrgentTaskRow";

type Bucket = "overdue" | "today" | "tomorrow" | "thisWeek";

interface TasksTabContentProps {
  boardId: string;
  overdueCards: Card[];
  todayCards: Card[];
  tomorrowCards: Card[];
  thisWeekCards: Card[];
  onSelectCard: (card: Card) => void;
}

const BUCKET_META: Record<
  Bucket,
  { label: string; icon: React.ReactNode; dot: string; emptyHint: string }
> = {
  overdue: {
    label: "Overdue",
    icon: <AlarmClock size={13} />,
    dot: "bg-rose-500",
    emptyHint: "No overdue tasks",
  },
  today: {
    label: "Today",
    icon: <CalendarClock size={13} />,
    dot: "bg-orange-500",
    emptyHint: "Nothing due today",
  },
  tomorrow: {
    label: "Tomorrow",
    icon: <CalendarDays size={13} />,
    dot: "bg-amber-500",
    emptyHint: "Nothing due tomorrow",
  },
  thisWeek: {
    label: "This week",
    icon: <CalendarRange size={13} />,
    dot: "bg-slate-400",
    emptyHint: "Nothing else due this week",
  },
};

export function TasksTabContent({
  boardId,
  overdueCards,
  todayCards,
  tomorrowCards,
  thisWeekCards,
  onSelectCard,
}: TasksTabContentProps) {
  const router = useRouter();
  const { columns, currentUserId } = useBoardStore();

  const hasMine = useMemo(() => {
    const all = [
      ...overdueCards,
      ...todayCards,
      ...tomorrowCards,
      ...thisWeekCards,
    ];
    return all.some((c) => c.assignee_id === currentUserId);
  }, [overdueCards, todayCards, tomorrowCards, thisWeekCards, currentUserId]);

  const [mineOnly, setMineOnly] = useState(false);

  const columnTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const col of columns) map.set(col.id, col.title);
    return map;
  }, [columns]);

  const filterMine = (list: Card[]) =>
    mineOnly && currentUserId
      ? list.filter((c) => c.assignee_id === currentUserId)
      : list;

  const sortByDate = (list: Card[]) =>
    [...list].sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });

  const buckets = useMemo(
    () => ({
      overdue: sortByDate(filterMine(overdueCards)),
      today: sortByDate(filterMine(todayCards)),
      tomorrow: sortByDate(filterMine(tomorrowCards)),
      thisWeek: sortByDate(filterMine(thisWeekCards)),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overdueCards, todayCards, tomorrowCards, thisWeekCards, mineOnly, currentUserId],
  );

  const totalUrgent =
    buckets.overdue.length +
    buckets.today.length +
    buckets.tomorrow.length +
    buckets.thisWeek.length;

  return (
    <div>
      {/* Title row — matches /my-tasks page header hierarchy */}
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
        <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
          <CalendarClock size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-slate-800 leading-tight">
            Up Next
          </h2>
          <p className="text-xs text-slate-500">
            งานที่ใกล้กำหนดและเลยกำหนดในบอร์ดนี้
          </p>
        </div>

        {hasMine && (
          <button
            type="button"
            onClick={() => setMineOnly((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
              mineOnly
                ? "bg-blue-50 border-blue-200 text-blue-700"
                : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <User size={12} />
            Just mine
          </button>
        )}

        <button
          onClick={() => router.push(`/board/${boardId}/tasks`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors shadow-sm"
        >
          <Plus size={13} />
          New Task
        </button>
      </div>

      {/* Summary strip — single subtle line under header (matches /my-tasks) */}
      {totalUrgent > 0 && (
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-200 text-xs flex-wrap text-slate-500">
          {(["overdue", "today", "tomorrow", "thisWeek"] as Bucket[]).map(
            (b) => {
              const count = buckets[b].length;
              if (count === 0) return null;
              const meta = BUCKET_META[b];
              return (
                <span key={b} className="flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                  <span className="font-semibold tabular-nums text-slate-700">
                    {count}
                  </span>
                  <span>{meta.label.toLowerCase()}</span>
                </span>
              );
            },
          )}
        </div>
      )}

      {/* Body */}
      {totalUrgent === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 mb-2">
            <Sparkles size={18} />
          </div>
          <p className="text-sm font-semibold text-slate-700">
            All clear — no urgent tasks right now
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {mineOnly
              ? "ไม่มีงานเร่งด่วนของคุณ"
              : "ไม่มีงานเลยกำหนด หรือใกล้กำหนดในบอร์ดนี้"}
          </p>
        </div>
      ) : (
        (["overdue", "today", "tomorrow", "thisWeek"] as Bucket[]).map(
          (b, idx) => (
            <BucketSection
              key={b}
              bucket={b}
              cards={buckets[b]}
              columnTitleById={columnTitleById}
              onSelect={onSelectCard}
              isLast={idx === 3}
            />
          ),
        )
      )}
    </div>
  );
}

function BucketSection({
  bucket,
  cards,
  columnTitleById,
  onSelect,
  isLast,
}: {
  bucket: Bucket;
  cards: Card[];
  columnTitleById: Map<string, string>;
  onSelect: (card: Card) => void;
  isLast: boolean;
}) {
  const meta = BUCKET_META[bucket];
  const isEmpty = cards.length === 0;

  return (
    <section className={isLast ? "" : "mb-3"}>
      {/* Prominent header bar — matches ProjectGroup style on /my-tasks */}
      <div
        className={`flex items-center gap-3 px-4 py-3 ${
          isEmpty ? "rounded-lg" : "rounded-t-lg"
        } bg-linear-to-r from-slate-100 via-slate-50 to-transparent border border-slate-200 ${
          isEmpty ? "" : "border-b-0"
        }`}
      >
        <span
          aria-hidden
          className={`w-3.5 h-3.5 rounded-full shrink-0 ring-2 ring-white shadow-sm ${meta.dot}`}
        />
        <span className="inline-flex items-center gap-1.5 text-base font-bold text-slate-900 tracking-tight">
          <span className="text-slate-500">{meta.icon}</span>
          {meta.label}
        </span>
        <span className="text-[11px] font-bold tabular-nums text-slate-700 px-2 py-0.5 rounded-md bg-white border border-slate-200 shadow-xs shrink-0">
          {cards.length}
        </span>
        {isEmpty && (
          <span className="ml-auto text-[11px] text-slate-400 italic">
            ✓ {meta.emptyHint}
          </span>
        )}
      </div>

      {!isEmpty && (
        <div className="border border-slate-200 border-t-slate-100 rounded-b-lg bg-white overflow-hidden">
          {cards.map((card) => (
            <UrgentTaskRow
              key={card.id}
              card={card}
              bucket={bucket}
              columnTitle={columnTitleById.get(card.column_id) ?? ""}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </section>
  );
}
