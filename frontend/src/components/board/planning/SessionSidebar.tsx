"use client";

import type { PlanningItem } from "@/types/planning";

export interface SessionStats {
  REQ: number;
  DEC: number;
  Q: number;
  dropped: number;
  promoted: number;
  selected: number;
}

interface Props {
  stats: SessionStats;
  promotedItems: PlanningItem[];
}

// Right-side summary panel. Live counts (REQ / DEC / Q / dropped) on top;
// list of titles already promoted to Board below — capped at 6 because
// once you've promoted that many, the remaining ones live on the board
// itself and don't need echoing back in the sidebar.
//
// Previously the surface also showed a "Shortcuts" block — removed when
// keyboard shortcuts stopped being central (see the rationale block in
// SessionCaptureView). Inline hints next to the actions cover the few
// keys that remain (Enter, Esc, arrows).
export function SessionSidebar({ stats, promotedItems }: Props) {
  return (
    <aside className="w-full shrink-0 lg:w-64">
      <div className="rounded-lg border border-slate-200 p-4">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          สรุป
        </p>
        <ul className="space-y-1.5 text-xs">
          <SidebarCount label="สิ่งที่อยากได้" value={stats.REQ} dotClass="bg-red-500" />
          <SidebarCount label="ที่ตกลงแล้ว" value={stats.DEC} dotClass="bg-blue-500" />
          <SidebarCount label="คำถามค้าง" value={stats.Q} dotClass="bg-amber-500" />
          <SidebarCount
            label="พักไว้ก่อน"
            value={stats.dropped}
            dotClass="bg-slate-300"
          />
        </ul>
      </div>

      {promotedItems.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 p-4">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            ส่งเข้า Board แล้ว
          </p>
          <ul className="space-y-1 text-xs">
            {promotedItems.slice(0, 6).map((it) => (
              <li key={it.id} className="truncate text-indigo-700">
                → {it.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}

function SidebarCount({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: number;
  dotClass: string;
}) {
  return (
    <li className="flex items-center justify-between text-slate-600">
      <span className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        {label}
      </span>
      <span className="font-semibold text-slate-800">{value}</span>
    </li>
  );
}
