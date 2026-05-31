"use client";

import { Activity as ActivityIcon } from "lucide-react";
import { avatarColor, initials } from "./activityFormat";

// Weekly capacity baseline (hours). The workload bar reads summed est-hours of
// a person's active cards against this cap. Placeholder until per-person caps
// exist in the backend — see the design handoff note.
export const WEEKLY_CAP_HOURS = 40;

export interface WorkloadUser {
  name: string;
  count: number;
  active: number;
  done: number;
  activeHours: number;
}

type Load = "over" | "healthy" | "light";

export function loadStatus(activeHours: number): Load {
  if (activeHours > WEEKLY_CAP_HOURS) return "over";
  if (activeHours >= WEEKLY_CAP_HOURS * 0.5) return "healthy";
  return "light";
}

// Load is ENCODED in colour: over = rose, healthy = primary blue, light = emerald.
const FILL: Record<Load, string> = {
  over: "bg-rose-500",
  healthy: "bg-blue-700",
  light: "bg-emerald-500",
};
const DOT: Record<Load, string> = {
  over: "bg-rose-500",
  healthy: "bg-blue-700",
  light: "bg-emerald-500",
};
const HRS: Record<Load, string> = {
  over: "text-rose-600",
  healthy: "text-slate-900",
  light: "text-emerald-600",
};

const ROLE_LABEL: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  member: "Member",
};

function CapacityRow({ user, role }: { user: WorkloadUser; role?: string }) {
  const status = loadStatus(user.activeHours);
  const pct = Math.min(100, (user.activeHours / WEEKLY_CAP_HOURS) * 100);
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-100 last:border-b-0">
      <div className="relative shrink-0">
        <div
          className={`w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-bold ${avatarColor(user.name)}`}
        >
          {initials(user.name)}
        </div>
        <span
          aria-hidden
          className={`absolute -right-0.5 -bottom-0.5 w-3 h-3 rounded-full ring-2 ring-white ${DOT[status]}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-bold text-slate-900 truncate">{user.name}</span>
          {role && <span className="text-[11px] text-slate-400 font-medium">{ROLE_LABEL[role] ?? role}</span>}
          <span className={`ml-auto text-xs font-bold ${HRS[status]}`}>
            {user.activeHours}h <span className="text-slate-400 font-semibold">/ {WEEKLY_CAP_HOURS}h</span>
          </span>
        </div>
        {/* capacity bar with a cap baseline marker at the right edge */}
        <div className="relative h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
          <div
            className={`absolute left-0 top-0 h-full rounded-full ${FILL[status]}`}
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-500">
          <span>
            <b className="text-slate-700 font-bold">{user.active}</b> กำลังทำ ·{" "}
            <b className="text-slate-700 font-bold">{user.done}</b> เสร็จ
          </span>
        </div>
      </div>
    </div>
  );
}

export function TeamCapacityList({
  workload,
  roleByName,
}: {
  workload: WorkloadUser[];
  roleByName: Map<string, string>;
}) {
  const active = workload.filter((u) => u.active > 0).sort((a, b) => b.activeHours - a.activeHours);
  const idle = workload.filter((u) => u.active === 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <ActivityIcon size={14} className="text-slate-400" />
          กำลังทำงานอยู่
        </span>
        <span className="text-[11px] text-slate-400 font-semibold">เรียงตามโหลด</span>
      </div>

      {active.length === 0 ? (
        <p className="text-sm text-slate-400 py-2">ยังไม่มีใครรับงานในบอร์ดนี้</p>
      ) : (
        <div className="flex flex-col">
          {active.map((u) => (
            <CapacityRow key={u.name} user={u} role={roleByName.get(u.name)} />
          ))}
        </div>
      )}

      {idle.length > 0 && (
        <div className="flex items-center gap-3 mt-3.5 px-4 py-3 rounded-lg border border-dashed border-slate-200 bg-slate-50">
          <div className="flex">
            {idle.slice(0, 4).map((u, i) => (
              <div
                key={u.name}
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ring-2 ring-slate-50 ${avatarColor(u.name)} ${i === 0 ? "" : "-ml-1.5"}`}
              >
                {initials(u.name)}
              </div>
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-600">
            <b className="text-slate-900">{idle.length} คนว่าง</b> ·{" "}
            {idle.map((u) => u.name).join(", ")} — ยังไม่มีงานที่รับผิดชอบ
          </span>
        </div>
      )}
    </div>
  );
}
