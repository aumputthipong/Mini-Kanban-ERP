"use client";

import { useMemo } from "react";
import {
  Users,
  Activity as ActivityIcon,
  Plus,
  ArrowRight,
  Pencil,
  Trash2,
  Check,
  Undo2,
} from "lucide-react";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import type { Activity } from "@/types/activity";
import type { BoardMember } from "@/types/board";
import { useBoardStore } from "@/store/useBoardStore";

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

// Pretty field names for "card.updated" — converts raw DB keys into human labels.
const FIELD_LABELS: Record<string, string> = {
  title: "title",
  description: "description",
  due_date: "due date",
  assignee_id: "assignee",
  priority: "priority",
  estimated_hours: "estimate",
  tags: "tags",
  column_id: "column",
  is_done: "status",
};

function describeActivity(
  a: Activity,
  columnTitleById: Map<string, string>,
): { action: string; target: string; dest: string } {
  const p = (a.payload ?? {}) as Record<string, any>;
  const title = typeof p.title === "string" ? p.title : "";
  switch (a.event_type) {
    case "card.created":
      return { action: "created card", target: title, dest: "" };
    case "card.moved": {
      const toCol = typeof p.to_column_id === "string" ? columnTitleById.get(p.to_column_id) : undefined;
      return { action: "moved card", target: title, dest: toCol ?? "" };
    }
    case "card.updated": {
      const fields = Array.isArray(p.fields) ? p.fields : [];
      const pretty = fields.map((f: string) => FIELD_LABELS[f] ?? f).join(", ");
      return { action: "updated card", target: title, dest: pretty };
    }
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

// Tiny action badge that overlays the bottom-right of the avatar — encodes the
// event type so the avatar color stays bound to the actor (not the action).
function eventBadge(eventType: string, payload: Record<string, any>): {
  Icon: typeof Plus;
  bg: string;
} {
  if (eventType === "card.done_toggled") {
    return payload.is_done
      ? { Icon: Check, bg: "bg-emerald-500" }
      : { Icon: Undo2, bg: "bg-slate-400" };
  }
  if (eventType.startsWith("card.created") || eventType === "column.created") {
    return { Icon: Plus, bg: "bg-blue-500" };
  }
  if (eventType === "card.moved") {
    return { Icon: ArrowRight, bg: "bg-amber-500" };
  }
  if (eventType.endsWith(".deleted")) {
    return { Icon: Trash2, bg: "bg-rose-500" };
  }
  if (eventType.endsWith(".updated") || eventType.endsWith(".renamed")) {
    return { Icon: Pencil, bg: "bg-violet-500" };
  }
  return { Icon: Pencil, bg: "bg-slate-400" };
}

function formatAbsoluteTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TeamTabContent({ workload, boardId, boardMembers }: TeamTabContentProps) {
  const { activities, loading, error } = useActivityFeed(boardId);
  const columns = useBoardStore((s) => s.columns);
  const columnTitleById = useMemo(() => {
    const map = new Map<string, string>();
    columns.forEach((c) => map.set(c.id, c.title));
    return map;
  }, [columns]);

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
          <div className="flex flex-col divide-y divide-slate-100">
            {fullWorkload.map((user, index) => {
              const maxTotal = Math.max(...fullWorkload.map((u) => u.count), 1);
              const barWidth =
                user.count === 0 ? 100 : Math.max(8, Math.round((user.count / maxTotal) * 100));
              const activePct = user.count > 0 ? (user.active / user.count) * 100 : 0;
              const donePct = user.count > 0 ? (user.done / user.count) * 100 : 0;
              const isHeavy = user.active >= OVERCAPACITY_THRESHOLD;
              const isIdle = user.count === 0;
              const todoCols = user.byColumn.filter((c) => c.category === "TODO");
              const doneCols = user.byColumn.filter((c) => c.category === "DONE");
              return (
                <div
                  key={index}
                  className="group relative flex flex-col gap-1.5 py-3 first:pt-1 last:pb-1"
                >
                  <div className="flex justify-between items-center text-sm gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-opacity ${avatarColor(user.name)} ${isIdle ? "opacity-50" : ""}`}
                      >
                        {initials(user.name)}
                      </div>
                      <span className={`font-medium truncate ${isIdle ? "text-slate-400" : "text-slate-700"}`}>
                        {user.name}
                      </span>
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

                  {/* Tooltip — clean light card */}
                  <div className="pointer-events-none absolute left-0 top-full mt-2 z-20 hidden group-hover:block w-64 rounded-xl bg-white text-xs shadow-xl border border-slate-200 overflow-hidden">
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                      <p className="font-semibold text-slate-700 truncate">{user.name}</p>
                      <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                        Workload
                      </span>
                    </div>

                    {todoCols.length === 0 && doneCols.length === 0 ? (
                      <p className="px-3 py-3 text-slate-400">No tasks assigned yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100">
                        {todoCols.length > 0 && (
                          <div className="px-3 py-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="flex items-center gap-1.5 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                Active
                              </span>
                              <span className="text-slate-700 font-semibold tabular-nums">{user.active}</span>
                            </div>
                            <ul className="space-y-1">
                              {todoCols.map((c) => (
                                <li
                                  key={c.title}
                                  className="flex justify-between items-center gap-2 text-slate-600"
                                >
                                  <span className="truncate">{c.title}</span>
                                  <span className="font-semibold text-slate-700 tabular-nums">{c.count}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {doneCols.length > 0 && (
                          <div className="px-3 py-2.5">
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold uppercase tracking-wider text-[10px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Done
                              </span>
                              <span className="text-slate-700 font-semibold tabular-nums">{user.done}</span>
                            </div>
                            <ul className="space-y-1">
                              {doneCols.map((c) => (
                                <li
                                  key={c.title}
                                  className="flex justify-between items-center gap-2 text-slate-600"
                                >
                                  <span className="truncate">{c.title}</span>
                                  <span className="font-semibold text-slate-700 tabular-nums">{c.count}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
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
          <ul className="divide-y divide-slate-100">
            {visibleActivities.slice(0, 10).map((event) => {
              const actorName = event.actor_name ?? "Someone";
              const { action, target, dest } = describeActivity(event, columnTitleById);
              const payload = (event.payload ?? {}) as Record<string, any>;
              const { Icon: BadgeIcon, bg: badgeBg } = eventBadge(event.event_type, payload);
              return (
                <li key={event.id} className="flex items-start gap-3 py-3 first:pt-1 last:pb-1">
                  {/* Avatar — color is bound to the actor (matches Workload). */}
                  <div className="relative shrink-0 mt-0.5">
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${avatarColor(actorName)}`}
                    >
                      {initials(actorName)}
                    </div>
                    {/* Action badge */}
                    <div
                      className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full ${badgeBg} ring-2 ring-white flex items-center justify-center`}
                    >
                      <BadgeIcon size={8} strokeWidth={3} className="text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs leading-snug">
                      <span className="font-semibold text-slate-800">{actorName}</span>{" "}
                      <span className="text-slate-500">{action}</span>
                      {target && (
                        <>
                          {" "}
                          <span className="font-semibold text-slate-800">&ldquo;{target}&rdquo;</span>
                        </>
                      )}
                      {dest && (
                        <>
                          {event.event_type === "card.moved" ? (
                            <span className="text-slate-500"> to </span>
                          ) : (
                            <span className="text-slate-400"> · </span>
                          )}
                          <span className="text-indigo-600 font-medium">{dest}</span>
                        </>
                      )}
                    </p>
                    <p
                      className="text-[10px] text-slate-400 mt-0.5"
                      title={formatAbsoluteTime(event.created_at)}
                    >
                      {relativeTime(event.created_at)}
                    </p>
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
