"use client";

import { useMemo } from "react";
import { AlertTriangle, Check } from "lucide-react";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import type { BoardMember } from "@/types/board";
import { useBoardStore } from "@/store/useBoardStore";
import { TeamActivityPanel } from "./TeamActivityPanel";
import {
  TeamCapacityList,
  WEEKLY_CAP_HOURS,
  type WorkloadUser,
} from "./TeamCapacityList";

interface TeamTabContentProps {
  workload: WorkloadUser[];
  boardId: string;
  boardMembers: BoardMember[];
}

// Gauge geometry — r=32 → circumference ≈ 201.
const RING = 201;

export function TeamTabContent({ workload, boardId, boardMembers }: TeamTabContentProps) {
  const { activities, loading, error } = useActivityFeed(boardId);
  const columns = useBoardStore((s) => s.columns);

  const columnTitleById = useMemo(() => {
    const map = new Map<string, string>();
    columns.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [columns]);

  const roleByName = useMemo(() => {
    const map = new Map<string, string>();
    boardMembers.forEach((m) => map.set(m.full_name, m.role));
    return map;
  }, [boardMembers]);

  // Merge workload with the full member list so 0-task members still appear
  // (they surface as "available" in the capacity list).
  const fullWorkload = useMemo<WorkloadUser[]>(() => {
    const byName = new Map(workload.map((u) => [u.name, u]));
    const merged: WorkloadUser[] = boardMembers.map(
      (m) =>
        byName.get(m.full_name) ?? {
          name: m.full_name,
          count: 0,
          active: 0,
          done: 0,
          activeHours: 0,
        },
    );
    workload.forEach((u) => {
      if (!merged.find((x) => x.name === u.name)) merged.push(u);
    });
    return merged;
  }, [workload, boardMembers]);

  const health = useMemo(() => {
    const memberCount = Math.max(1, fullWorkload.length);
    const totalHours = fullWorkload.reduce((s, u) => s + u.activeHours, 0);
    const overloaded = fullWorkload.filter((u) => u.activeHours > WEEKLY_CAP_HOURS).length;
    const free = fullWorkload.filter((u) => u.active === 0).length;
    const loadPct = Math.round((totalHours / (memberCount * WEEKLY_CAP_HOURS)) * 100);
    return { overloaded, free, loadPct };
  }, [fullWorkload]);

  const ringOffset = RING * (1 - Math.min(100, Math.max(0, health.loadPct)) / 100);

  const headline =
    health.overloaded > 0 ? (
      <>
        <span className="text-rose-200 font-bold">{health.overloaded} คนงานล้น</span> —
        ควรกระจายงานให้คนที่ว่าง
      </>
    ) : health.free === fullWorkload.length ? (
      <>ยังไม่มีใครรับงานในบอร์ดนี้</>
    ) : (
      <>ทีมสมดุล — ไม่มีใครงานล้นตอนนี้</>
    );

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 leading-tight tracking-tight">Team</h2>
        <p className="text-xs text-slate-500 mt-1">
          โหลดงานเทียบกับกำลังคน · ใครล้น ใครว่าง ในแว้บเดียว
        </p>
      </div>

      {/* Health header — answers "is the team healthy?" first */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3.5">
        <div className="flex items-center gap-5 rounded-xl bg-blue-800 text-white px-6 py-5">
          <div className="relative w-[78px] h-[78px] shrink-0">
            <svg width="78" height="78" className="-rotate-90">
              <circle cx="39" cy="39" r="32" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="8" />
              <circle
                cx="39"
                cy="39"
                r="32"
                fill="none"
                stroke="#fff"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING}
                strokeDashoffset={ringOffset}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xl font-bold leading-none tabular-nums">{health.loadPct}%</span>
              <span className="text-[8.5px] font-semibold uppercase tracking-wider opacity-80 mt-0.5">
                โหลดทีม
              </span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-80">
              สถานะทีม
            </p>
            <p className="text-lg font-bold leading-snug mt-1">{headline}</p>
          </div>
        </div>

        <div className="flex lg:flex-col gap-3 lg:w-48">
          <HealthStat
            icon={<AlertTriangle size={16} />}
            tone="over"
            value={health.overloaded}
            label="งานล้น (>100%)"
          />
          <HealthStat
            icon={<Check size={16} />}
            tone="free"
            value={health.free}
            label="ว่าง รับงานได้"
          />
        </div>
      </div>

      {/* Capacity list (left) + activity (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.25fr_1fr] gap-5">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
          <TeamCapacityList workload={fullWorkload} roleByName={roleByName} />
        </div>
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

function HealthStat({
  icon,
  tone,
  value,
  label,
}: {
  icon: React.ReactNode;
  tone: "over" | "free";
  value: number;
  label: string;
}) {
  const iconCls =
    tone === "over" ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600";
  const valueCls = tone === "over" ? "text-rose-600" : "text-emerald-600";
  return (
    <div className="flex flex-1 items-center gap-3 px-3.5 py-3 rounded-lg bg-white border border-slate-200">
      <span className={`w-[30px] h-[30px] rounded-lg flex items-center justify-center shrink-0 ${iconCls}`}>
        {icon}
      </span>
      <div className="min-w-0">
        <p className={`text-lg font-bold leading-none tabular-nums ${valueCls}`}>{value}</p>
        <p className="text-[11px] font-semibold text-slate-400 leading-tight mt-1">{label}</p>
      </div>
    </div>
  );
}
