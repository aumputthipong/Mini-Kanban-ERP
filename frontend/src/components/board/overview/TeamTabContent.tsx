"use client";

import { useMemo } from "react";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { useBoardStore } from "@/store/useBoardStore";
import { TeamActivityPanel } from "./TeamActivityPanel";
import { TeamOwnershipList } from "./TeamOwnershipList";

interface TeamTabContentProps {
  boardId: string;
}

export function TeamTabContent({ boardId }: TeamTabContentProps) {
  const { activities, loading, error } = useActivityFeed(boardId);
  const columns = useBoardStore((s) => s.columns);

  const columnTitleById = useMemo(() => {
    const map = new Map<string, string>();
    columns.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [columns]);

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Team</h2>
        <p className="text-xs text-slate-500 mt-1">
          ใครถือ card อะไรอยู่ตอนนี้ · นับเฉพาะงานที่ยังไม่เสร็จ
        </p>
      </div>

      {/* Ownership (left) + activity (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5">
        <TeamOwnershipList />
        <TeamActivityPanel
          activities={activities}
          loading={loading}
          error={error}
          columnTitleById={columnTitleById}
        />
      </div>
    </div>
  );
}
