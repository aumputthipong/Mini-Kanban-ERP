"use client";

import { Inbox, Search } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterChipBar } from "@/components/my-work/FilterChipBar";
import { WorkGroupSection } from "@/components/my-work/WorkGroupSection";
import { MyWorkEmptyState } from "@/components/my-work/MyWorkEmptyState";
import { MyWorkSkeleton } from "@/components/my-work/MyWorkSkeleton";
import { completeMyTask, fetchMyWork, snoozeCardDueDate } from "@/lib/myWorkApi";
import {
  isMyWorkFilter,
  type MyWorkCard,
  type MyWorkFilter,
  type MyWorkGroup,
  type MyWorkResponse,
} from "@/types/myWork";

const EMPTY_COUNTS = {
  overdue: 0,
  today: 0,
  this_week: 0,
  later: 0,
  no_date: 0,
  total: 0,
};

const GROUP_ORDER_BY_FILTER: Record<MyWorkFilter, MyWorkGroup[]> = {
  all: ["overdue", "today", "this_week", "later", "no_date"],
  overdue: ["overdue"],
  today: ["today"],
  this_week: ["this_week"],
  no_date: ["no_date"],
};

export default function MyWorkPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filterParam = searchParams.get("filter");
  const filter: MyWorkFilter = isMyWorkFilter(filterParam) ? filterParam : "all";
  const query = (searchParams.get("q") ?? "").trim();

  const [data, setData] = useState<MyWorkResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // setState-during-render pattern (per AGENTS.md): when the filter URL
  // param changes, clear the cached payload so isLoading flips back to true
  // before the effect fires. Doing this synchronously inside useEffect would
  // trip react-hooks/set-state-in-effect.
  const [lastFilter, setLastFilter] = useState(filter);
  if (lastFilter !== filter) {
    setLastFilter(filter);
    setData(null);
  }
  const isLoading = data === null && error === null;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    fetchMyWork({ filter, signal: controller.signal })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "โหลดงานไม่สำเร็จ");
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [filter]);

  const setFilter = useCallback(
    (next: MyWorkFilter) => {
      const params = new URLSearchParams(searchParams);
      if (next === "all") params.delete("filter");
      else params.set("filter", next);
      const qs = params.toString();
      router.replace(qs ? `/my-work?${qs}` : "/my-work");
    },
    [router, searchParams],
  );

  const setQuery = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams);
      const trimmed = next.trim();
      if (trimmed === "") params.delete("q");
      else params.set("q", trimmed);
      const qs = params.toString();
      router.replace(qs ? `/my-work?${qs}` : "/my-work");
    },
    [router, searchParams],
  );

  const handleComplete = useCallback(
    async (cardId: string) => {
      if (!data) return;
      const prev = data;
      setData({
        ...prev,
        cards: prev.cards.filter((c) => c.id !== cardId),
      });
      try {
        await completeMyTask(cardId);
      } catch (err) {
        setData(prev);
        setError(err instanceof Error ? err.message : "ทำเครื่องหมายเสร็จไม่สำเร็จ");
      }
    },
    [data],
  );

  const handleSnooze = useCallback(
    async (cardId: string, dueDate: string) => {
      if (!data) return;
      const prev = data;
      // Optimistic: drop the card from the current filtered view; on next
      // refetch it'll reappear in its new bucket. Refetch immediately so the
      // group sections + counters reflect the move without forcing the user
      // to navigate away.
      setData({ ...prev, cards: prev.cards.filter((c) => c.id !== cardId) });
      try {
        await snoozeCardDueDate(cardId, dueDate);
        const refreshed = await fetchMyWork({ filter });
        setData(refreshed);
      } catch (err) {
        setData(prev);
        setError(err instanceof Error ? err.message : "เลื่อนวันไม่สำเร็จ");
      }
    },
    [data, filter],
  );

  const filteredCards = useMemo(() => {
    const cards = data?.cards ?? [];
    if (!query) return cards;
    const needle = query.toLowerCase();
    return cards.filter(
      (c) =>
        c.title.toLowerCase().includes(needle) ||
        c.board_name.toLowerCase().includes(needle),
    );
  }, [data?.cards, query]);

  const cardsByGroup = useMemo(() => groupCards(filteredCards), [filteredCards]);
  const counts = data?.counts ?? EMPTY_COUNTS;
  const orderedGroups = GROUP_ORDER_BY_FILTER[filter];

  return (
    <div className="h-full overflow-y-auto">
      <main className="p-6 md:p-8 max-w-5xl mx-auto">
        <header className="flex items-start gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
            <Inbox size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 leading-tight">My Work</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              งานของคุณข้ามทุก board · {counts.total} งานทั้งหมด · เรียงตาม due date
            </p>
          </div>
        </header>

        <div className="mb-5 flex items-center justify-between gap-3 flex-wrap">
          <FilterChipBar active={filter} counts={counts} onChange={setFilter} />
          <SearchInput value={query} onChange={setQuery} />
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <MyWorkSkeleton />
        ) : filteredCards.length === 0 ? (
          query ? (
            <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
              <p className="text-sm font-semibold text-slate-700">
                {`ไม่พบงานที่ตรงกับ "${query}"`}
              </p>
              <p className="text-xs text-slate-400 mt-1">ลองคำค้นอื่น หรือล้างกล่องค้นหา</p>
            </div>
          ) : (
            <MyWorkEmptyState filter={filter} />
          )
        ) : (
          orderedGroups.map((g) => (
            <WorkGroupSection
              key={g}
              group={g}
              cards={cardsByGroup[g]}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
            />
          ))
        )}
      </main>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [local, setLocal] = useState(value);
  // Keep local input synced with URL changes from filter chip clicks.
  useEffect(() => {
    setLocal(value);
  }, [value]);
  // Debounce URL writes so each keystroke doesn't push a history entry.
  useEffect(() => {
    if (local === value) return;
    const handle = window.setTimeout(() => onChange(local), 250);
    return () => window.clearTimeout(handle);
  }, [local, value, onChange]);
  return (
    <label className="relative flex items-center text-xs">
      <Search size={12} className="absolute left-2 text-slate-400" />
      <input
        type="search"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="ค้นหางาน..."
        className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-md bg-white text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-slate-400 w-56"
      />
    </label>
  );
}

function groupCards(cards: MyWorkCard[]): Record<MyWorkGroup, MyWorkCard[]> {
  const buckets: Record<MyWorkGroup, MyWorkCard[]> = {
    overdue: [],
    today: [],
    this_week: [],
    later: [],
    no_date: [],
  };
  for (const c of cards) buckets[c.group].push(c);
  return buckets;
}
