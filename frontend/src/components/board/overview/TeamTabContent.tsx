"use client";

import { useMemo } from "react";
import { Users, Activity as ActivityIcon } from "lucide-react";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import type { Activity } from "@/types/activity";
import type { BoardMember } from "@/types/board";

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
  boardMembers: BoardMember[];
}

const OVERCAPACITY_THRESHOLD = 5;

// Deterministic pastel palette for avatar initials — keyed off the user's name
// so the same person always gets the same color across renders.
const AVATAR_PALETTE = [
  "bg-rose-200 text-rose-700",
  "bg-amber-200 text-amber-700",
  "bg-emerald-200 text-emerald-700",
  "bg-sky-200 text-sky-700",
  "bg-violet-200 text-violet-700",
  "bg-pink-200 text-pink-700",
  "bg-teal-200 text-teal-700",
  "bg-indigo-200 text-indigo-700",
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[h % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? "?";
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Merge consecutive card.updated events from the same actor on the same card
// within this window into one row — reduces feed spam from rapid field edits.
const UPDATE_GROUP_WINDOW_MS = 10 * 60 * 1000;

// Activities arrive newest-first. We walk them in order and, when we see a
// card.updated event, check if the most-recent item in the output list is
// another card.updated by the same actor on the same card within the window.
// If so, merge the `fields` arrays into that existing item instead of pushing.
function groupCardUpdates(activities: Activity[]): Activity[] {
  const out: Activity[] = [];
  for (const a of activities) {
    if (a.event_type !== "card.updated" || out.length === 0) {
      out.push(a);
      continue;
    }
    const prev = out[out.length - 1];
    const prevPayload = (prev.payload ?? {}) as Record<string, any>;
    const currPayload = (a.payload ?? {}) as Record<string, any>;
    const sameActor = prev.actor_id === a.actor_id;
    const sameCard =
      prev.event_type === "card.updated" &&
      (prev.entity_id ?? prevPayload.card_id) ===
        (a.entity_id ?? currPayload.card_id);
    const withinWindow =
      new Date(prev.created_at).getTime() - new Date(a.created_at).getTime() <=
      UPDATE_GROUP_WINDOW_MS;
    if (sameActor && sameCard && withinWindow) {
      const prevFields = Array.isArray(prevPayload.fields) ? prevPayload.fields : [];
      const currFields = Array.isArray(currPayload.fields) ? currPayload.fields : [];
      const merged = Array.from(new Set([...prevFields, ...currFields]));
      out[out.length - 1] = {
        ...prev,
        payload: { ...prevPayload, fields: merged },
      };
      continue;
    }
    out.push(a);
  }
  return out;
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

export function TeamTabContent({ workload, boardId, boardMembers }: TeamTabContentProps) {
  const { activities, loading, error } = useActivityFeed(boardId);

  // Merge workload with full member list so members with 0 assigned cards still appear.
  const fullWorkload = useMemo<WorkloadUser[]>(() => {
    const byName = new Map(workload.map((u) => [u.name, u]));
    const merged: WorkloadUser[] = boardMembers.map(
      (m) =>
        byName.get(m.full_name) ?? {
          name: m.full_name,
          count: 0,
          active: 0,
          done: 0,
          byColumn: [],
        },
    );
    // include any workload entries for people not in boardMembers (defensive)
    workload.forEach((u) => {
      if (!merged.find((x) => x.name === u.name)) merged.push(u);
    });
    return merged.sort((a, b) => b.active - a.active || b.count - a.count);
  }, [workload, boardMembers]);

  const visibleActivities = useMemo(() => groupCardUpdates(activities), [activities]);

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
        {fullWorkload.length === 0 ? (
          <p className="text-sm text-slate-400">No board members yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {fullWorkload.map((user, index) => {
              const maxTotal = Math.max(...fullWorkload.map((u) => u.count), 1);
              const barWidth =
                user.count === 0 ? 100 : Math.max(8, Math.round((user.count / maxTotal) * 100));
              const activePct = user.count > 0 ? (user.active / user.count) * 100 : 0;
              const donePct = user.count > 0 ? (user.done / user.count) * 100 : 0;
              const isHeavy = user.active >= OVERCAPACITY_THRESHOLD;
              const todoCols = user.byColumn.filter((c) => c.category === "TODO");
              const doneCols = user.byColumn.filter((c) => c.category === "DONE");
              return (
                <div key={index} className="group relative flex flex-col gap-1.5">
                  <div className="flex justify-between items-center text-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${avatarColor(user.name)}`}
                      >
                        {initials(user.name)}
                      </div>
                      <span className="font-medium text-slate-700 truncate">{user.name}</span>
                    </div>
                    <span className="text-xs text-slate-500 shrink-0">
                      {user.count === 0 ? (
                        <span className="text-slate-400">No tasks</span>
                      ) : (
                        <>
                          <span className={isHeavy ? "font-bold text-rose-500" : "font-semibold text-slate-600"}>
                            {user.active} active
                          </span>
                          <span className="text-slate-300 mx-1.5">·</span>
                          <span className="text-emerald-600 font-semibold">{user.done} done</span>
                          {isHeavy && <span className="ml-1">⚠️</span>}
                        </>
                      )}
                    </span>
                  </div>
                  {/* Track: full-width slim background, bar fills proportionally on top */}
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden cursor-help">
                    <div className="h-full flex" style={{ width: `${barWidth}%` }}>
                      {activePct > 0 && (
                        <div
                          className={isHeavy ? "bg-rose-400" : "bg-slate-500"}
                          style={{ width: `${activePct}%` }}
                        />
                      )}
                      {donePct > 0 && <div className="bg-emerald-500" style={{ width: `${donePct}%` }} />}
                    </div>
                  </div>

                  {/* Tooltip */}
                  <div className="pointer-events-none absolute left-0 top-full mt-1.5 z-10 hidden group-hover:block w-60 rounded-lg bg-slate-900 text-white text-xs shadow-xl border border-slate-700 p-3">
                    <p className="font-semibold mb-2 pb-1.5 border-b border-slate-700">{user.name}&apos;s Workload</p>
                    {todoCols.length > 0 && (
                      <div className="mb-2">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-slate-300 font-medium">Active</p>
                          <p className="text-slate-100 font-semibold tabular-nums">{user.active} tasks</p>
                        </div>
                        <ul className="space-y-0.5">
                          {todoCols.map((c) => (
                            <li key={c.title} className="flex justify-between items-center gap-2 text-slate-200">
                              <span className="truncate">└ {c.title}</span>
                              <span className="font-semibold text-slate-100 tabular-nums">{c.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {doneCols.length > 0 && (
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-emerald-300 font-medium">Done</p>
                          <p className="text-slate-100 font-semibold tabular-nums">{user.done} tasks</p>
                        </div>
                        <ul className="space-y-0.5">
                          {doneCols.map((c) => (
                            <li key={c.title} className="flex justify-between items-center gap-2 text-slate-200">
                              <span className="truncate">└ {c.title}</span>
                              <span className="font-semibold text-slate-100 tabular-nums">{c.count}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {todoCols.length === 0 && doneCols.length === 0 && (
                      <p className="text-slate-400">No tasks assigned yet.</p>
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
        {loading && visibleActivities.length === 0 ? (
          <p className="text-sm text-slate-400">Loading activity…</p>
        ) : error ? (
          <p className="text-sm text-rose-500">Failed to load activity.</p>
        ) : visibleActivities.length === 0 ? (
          <p className="text-sm text-slate-400">No activity yet.</p>
        ) : (
          <ul className="space-y-3">
            {visibleActivities.slice(0, 10).map((event) => {
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
                          <span className="font-bold text-slate-900">&ldquo;{target}&rdquo;</span>
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
