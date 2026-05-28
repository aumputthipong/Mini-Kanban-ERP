"use client";

import { Inbox } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { FilterChipBar } from "@/components/my-work/FilterChipBar";
import { WorkGroupSection } from "@/components/my-work/WorkGroupSection";
import { MyWorkEmptyState } from "@/components/my-work/MyWorkEmptyState";
import { MyWorkSkeleton } from "@/components/my-work/MyWorkSkeleton";
import { completeMyTask, fetchMyWork } from "@/lib/myWorkApi";
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

  const [data, setData] = useState<MyWorkResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setIsLoading(true);
    fetchMyWork({ filter, signal: controller.signal })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "โหลดงานไม่สำเร็จ");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
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

  const cardsByGroup = useMemo(() => groupCards(data?.cards ?? []), [data?.cards]);
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

        <div className="mb-5">
          <FilterChipBar active={filter} counts={counts} onChange={setFilter} />
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <MyWorkSkeleton />
        ) : data?.cards.length === 0 ? (
          <MyWorkEmptyState filter={filter} />
        ) : (
          orderedGroups.map((g) => (
            <WorkGroupSection
              key={g}
              group={g}
              cards={cardsByGroup[g]}
              onComplete={handleComplete}
            />
          ))
        )}
      </main>
    </div>
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
