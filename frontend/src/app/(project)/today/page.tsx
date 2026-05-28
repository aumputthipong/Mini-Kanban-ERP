"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { TodayGreeting } from "@/components/today/TodayGreeting";
import { TodayStatCards } from "@/components/today/TodayStatCards";
import { WorkGroupSection } from "@/components/my-work/WorkGroupSection";
import { MyWorkSkeleton } from "@/components/my-work/MyWorkSkeleton";
import { apiClient } from "@/lib/apiClient";
import { completeMyTask, fetchMyWork, snoozeCardDueDate } from "@/lib/myWorkApi";
import type { MyWorkResponse } from "@/types/myWork";

interface MeResponse {
  full_name?: string;
}

export default function TodayPage() {
  const [data, setData] = useState<MyWorkResponse | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Loading is derived — flipping setIsLoading inside the effect trips
  // react-hooks/set-state-in-effect under React 19. This page only fetches
  // once (no deps), so isLoading is simply "haven't received data yet".
  const isLoading = data === null && error === null;

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    Promise.all([
      fetchMyWork({ filter: "all", signal: controller.signal }),
      apiClient<MeResponse>("/auth/me", { signal: controller.signal }).catch(
        () => null,
      ),
    ])
      .then(([work, me]) => {
        if (cancelled) return;
        setData(work);
        if (me?.full_name) setFullName(me.full_name);
      })
      .catch((err: unknown) => {
        if (cancelled || controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "โหลดข้อมูลไม่สำเร็จ");
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  const handleComplete = useCallback(
    async (cardId: string) => {
      if (!data) return;
      const prev = data;
      setData({ ...prev, cards: prev.cards.filter((c) => c.id !== cardId) });
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
      // Drop the card immediately — anything snoozed off "today" disappears
      // from this focused view. Refetch repopulates if the new date lands
      // back inside the Today bucket (e.g. picking literally today).
      setData({ ...prev, cards: prev.cards.filter((c) => c.id !== cardId) });
      try {
        await snoozeCardDueDate(cardId, dueDate);
        const refreshed = await fetchMyWork({ filter: "all" });
        setData(refreshed);
      } catch (err) {
        setData(prev);
        setError(err instanceof Error ? err.message : "เลื่อนวันไม่สำเร็จ");
      }
    },
    [data],
  );

  const tomorrowKey = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t.toISOString().slice(0, 10);
  }, []);

  const overdueCards = useMemo(
    () => data?.cards.filter((c) => c.group === "overdue") ?? [],
    [data?.cards],
  );
  const todayCards = useMemo(
    () => data?.cards.filter((c) => c.group === "today") ?? [],
    [data?.cards],
  );
  const tomorrowCount = useMemo(
    () => data?.cards.filter((c) => c.due_date === tomorrowKey).length ?? 0,
    [data?.cards, tomorrowKey],
  );

  const counts = data?.counts;

  return (
    <div className="h-full overflow-y-auto">
      <main className="p-6 md:p-8 max-w-5xl mx-auto">
        <div className="flex items-start justify-between gap-6 flex-wrap mb-2">
          <TodayGreeting
            fullName={fullName}
            todayCount={counts?.today ?? 0}
            overdueCount={counts?.overdue ?? 0}
          />
          {counts && (
            <TodayStatCards
              overdue={counts.overdue}
              today={counts.today}
              tomorrow={tomorrowCount}
            />
          )}
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-md border border-rose-200 bg-rose-50 text-xs text-rose-700">
            {error}
          </div>
        )}

        {isLoading ? (
          <MyWorkSkeleton />
        ) : (
          <>
            <WorkGroupSection
              group="overdue"
              cards={overdueCards}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
            />
            <WorkGroupSection
              group="today"
              cards={todayCards}
              onComplete={handleComplete}
              onSnooze={handleSnooze}
            />
            {overdueCards.length === 0 && todayCards.length === 0 && (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-xl bg-white">
                <p className="text-sm font-semibold text-slate-700">
                  ไม่มีงานวันนี้และไม่มีงานเลยกำหนด
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  ใช้เวลาตอนนี้วางแผนงานสัปดาห์หน้าหรือพักก็ดี
                </p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Link
                href="/my-work"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                ดูงานทั้งหมดใน My Work
                <ArrowRight size={12} />
              </Link>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
