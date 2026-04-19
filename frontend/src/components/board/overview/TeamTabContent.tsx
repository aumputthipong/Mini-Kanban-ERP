"use client";

import { Users, Activity as ActivityIcon } from "lucide-react";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import type { Activity } from "@/types/activity";

interface WorkloadColumnBreakdown {
  title: string;
  category: "TODO" | "DONE";
  position: number;
  count: number;
}

interface WorkloadUser {
  name: string;
  count: number;
  active: number;
  done: number;
  byColumn: WorkloadColumnBreakdown[];
}

interface TeamTabContentProps {
  workload: WorkloadUser[];
  boardId: string;
}

function relativeTime(iso: string): string {
  const now = Date.now();
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Math.max(0, now - t);
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function describeActivity(a: Activity): { action: string; target: string; dest: string } {
  const p = (a.payload ?? {}) as Record<string, any>;
  const title = typeof p.title === "string" ? p.title : "";
  switch (a.event_type) {
    case "card.created":
      return { action: "created card", target: title, dest: "" };
    case "card.moved":
      return { action: "moved card", target: title, dest: "" };
    case "card.updated":
      return { action: "updated card", target: title, dest: Array.isArray(p.fields) ? p.fields.join(", ") : "" };
    case "card.deleted":
      return { action: "deleted card", target: title, dest: "" };
    case "card.done_toggled":
      return { action: p.is_done ? "completed card" : "reopened card", target: title, dest: "" };
    case "column.created":
      return { action: "created column", target: title, dest: "" };
    case "column.deleted":
      return { action: "deleted column", target: title, dest: "" };
    case "column.renamed":
      return { action: "renamed column", target: typeof p.new_title === "string" ? p.new_title : "", dest: "" };
    default:
      return { action: a.event_type, target: "", dest: "" };
  }
}

function colorForEvent(eventType: string): string {
  if (eventType.startsWith("card.created") || eventType === "column.created") return "bg-blue-500";
  if (eventType === "card.done_toggled") return "bg-emerald-500";
  if (eventType.startsWith("card.moved")) return "bg-amber-500";
  if (eventType.endsWith(".deleted")) return "bg-rose-500";
  if (eventType.endsWith(".updated") || eventType.endsWith(".renamed")) return "bg-violet-500";
  return "bg-slate-400";
}

export function TeamTabContent({ workload, boardId }: TeamTabContentProps) {
  const { activities, loading, error } = useActivityFeed(boardId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Team Workload */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Users size={15} className="text-slate-400" />
          <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
            Team Workload
          </h3>
        </div>
        {workload.length === 0 ? (
          <p className="text-sm text-slate-400">No active tasks assigned.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {workload.map((user, index) => {
              const maxTotal = Math.max(...workload.map((u) => u.count), 1);
              const barWidth = Math.max(8, Math.round((user.count / maxTotal) * 100));
              const activePct = user.count > 0 ? (user.active / user.count) * 100 : 0;
              const donePct = user.count > 0 ? (user.done / user.count) * 100 : 0;
              const isHeavy = user.active >= 5;
              const todoCols = user.byColumn.filter((c) => c.category === "TODO");
              const doneCols = user.byColumn.filter((c) => c.category === "DONE");
              return (
                <div key={index} className="group relative flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 truncate">{user.name}</span>
                    <span className="text-xs text-slate-500">
                      <span className={isHeavy ? "font-bold text-red-500" : "font-semibold text-slate-600"}>
                        {user.active} active
                      </span>
                      <span className="text-slate-300 mx-1.5">·</span>
                      <span className="text-emerald-600 font-semibold">{user.done} done</span>
                      {isHeavy && <span className="ml-1">⚠️</span>}
                    </span>
                  </div>
                  <div
                    className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex cursor-help"
                    style={{ width: `${barWidth}%` }}
                  >
                    {activePct > 0 && (
                      <div className={isHeavy ? "bg-red-400" : "bg-slate-400"} style={{ width: `${activePct}%` }} />
                    )}
                    {donePct > 0 && <div className="bg-emerald-500" style={{ width: `${donePct}%` }} />}
                  </div>

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute left-0 top-full mt-1 z-10 hidden group-hover:block w-56 rounded-lg bg-slate-900 text-white text-xs shadow-lg p-3">
                    <p className="font-semibold mb-1.5">{user.name}&apos;s Workload</p>
                    {todoCols.length > 0 && (
                      <div className="mb-2">
                        <p className="text-slate-300 font-medium mb-0.5">Active: {user.active} tasks</p>
                        <ul className="ml-2 space-y-0.5">
                          {todoCols.map((c) => (
                            <li key={c.title} className="text-slate-200 flex justify-between gap-2">
                              <span className="truncate">└ {c.title}</span>
                              <span className="font-semibold text-slate-100">{c.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {doneCols.length > 0 && (
                      <div>
                        <p className="text-emerald-300 font-medium mb-0.5">Done: {user.done} tasks</p>
                        <ul className="ml-2 space-y-0.5">
                          {doneCols.map((c) => (
                            <li key={c.title} className="text-slate-200 flex justify-between gap-2">
                              <span className="truncate">└ {c.title}</span>
                              <span className="font-semibold text-slate-100">{c.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {todoCols.length === 0 && doneCols.length === 0 && (
                      <p className="text-slate-400">No column breakdown.</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Activity Stream */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ActivityIcon size={15} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
              Activity
            </h3>
          </div>
        </div>
        {loading && activities.length === 0 ? (
          <p className="text-sm text-slate-400">Loading activity…</p>
        ) : error ? (
          <p className="text-sm text-rose-500">Failed to load activity.</p>
        ) : activities.length === 0 ? (
          <p className="text-sm text-slate-400">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {activities.slice(0, 10).map((event) => {
              const actorName = event.actor_name ?? "Someone";
              const { action, target, dest } = describeActivity(event);
              return (
                <li key={event.id} className="flex items-start gap-3">
                  <div
                    className={`w-6 h-6 rounded-full ${colorForEvent(event.event_type)} flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5`}
                  >
                    {actorName[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug">
                      <span className="font-semibold">{actorName}</span>{" "}
                      {action}
                      {target && (
                        <>
                          {" "}
                          <span className="font-medium text-slate-800">&ldquo;{target}&rdquo;</span>
                        </>
                      )}
                      {dest && (
                        <>
                          {" "}
                          → <span className="text-indigo-600 font-medium">{dest}</span>
                        </>
                      )}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{relativeTime(event.created_at)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
