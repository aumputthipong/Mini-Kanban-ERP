"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastStore } from "@/store/useToastStore";
import { planningApi } from "@/lib/planningApi";
import type { PlanningSessionSummary } from "@/types/planning";
import { formatRelativeFromNow } from "./planningFormat";

interface Props {
  boardId: string;
}

// Sessions list — chronological with a "this week / this month / older"
// rough grouping. Counts read live from each row so they stay accurate
// after the user moves items in/out of dropped or promoted.
export function SessionListView({ boardId }: Props) {
  const router = useRouter();
  const [sessions, setSessions] = useState<PlanningSessionSummary[] | null>(null);
  const [creating, setCreating] = useState(false);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    let cancelled = false;
    planningApi
      .listSessions(boardId)
      .then((rows) => {
        if (!cancelled) setSessions(rows);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [boardId]);

  const createSession = useCallback(async () => {
    if (creating) return;
    setCreating(true);
    try {
      const sess = await planningApi.createSession(boardId, {
        title: defaultSessionTitle(),
      });
      router.push(`/board/${boardId}/planning/${sess.id}`);
    } catch {
      showToast({ message: "Couldn't create session", duration: 4000 });
      setCreating(false);
    }
  }, [boardId, creating, router, showToast]);

  if (sessions === null) {
    return <ListSkeleton />;
  }

  // Aggregate stats across all sessions for the header line.
  const openQuestions = sessions.reduce((sum, s) => sum + s.q_count, 0);
  const promoted = sessions.reduce((sum, s) => sum + s.promoted_count, 0);

  const grouped = groupSessions(sessions);

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <FileText size={20} className="text-indigo-600" />
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Planning
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            จด requirement ระหว่างประชุม · promote เป็น Kanban task เมื่อพร้อม
          </p>
        </div>
        <button
          type="button"
          onClick={createSession}
          disabled={creating}
          className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          <Plus size={14} />
          New Session
        </button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState onCreate={createSession} creating={creating} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span>
              <strong className="text-slate-800">{sessions.length}</strong>{" "}
              session{sessions.length === 1 ? "" : "s"}
            </span>
            <span>
              <strong className="text-indigo-700">{promoted}</strong> promoted → tasks
            </span>
            <span>
              <strong className="text-amber-700">{openQuestions}</strong> open question
              {openQuestions === 1 ? "" : "s"}
            </span>
          </div>

          {grouped.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <div className="flex flex-col gap-2">
                {group.sessions.map((s) => (
                  <SessionRow key={s.id} boardId={boardId} session={s} />
                ))}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

function SessionRow({
  boardId,
  session,
}: {
  boardId: string;
  session: PlanningSessionSummary;
}) {
  return (
    <Link
      href={`/board/${boardId}/planning/${session.id}`}
      className="group flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-indigo-300 hover:bg-indigo-50/30"
    >
      <FileText size={18} className="shrink-0 text-slate-400" />
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-semibold text-slate-800 group-hover:text-indigo-700">
          {session.title}
        </p>
        <p className="text-xs text-slate-500">
          {session.label ? `${session.label} · ` : ""}
          {formatRelativeFromNow(session.updated_at)}
        </p>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold">
        {session.req_count > 0 && (
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">
            {session.req_count} REQ
          </span>
        )}
        {session.dec_count > 0 && (
          <span className="rounded bg-blue-50 px-1.5 py-0.5 text-blue-700">
            {session.dec_count} DEC
          </span>
        )}
        {session.q_count > 0 && (
          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
            {session.q_count} Q
          </span>
        )}
        {session.dropped_count > 0 && (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 line-through">
            {session.dropped_count}
          </span>
        )}
      </div>
      {session.promoted_count > 0 && (
        <span className="text-xs text-indigo-600">
          → {session.promoted_count} promoted
        </span>
      )}
    </Link>
  );
}

function EmptyState({ onCreate, creating }: { onCreate: () => void; creating: boolean }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
      <FileText size={32} className="mx-auto mb-3 text-slate-400" />
      <h3 className="text-base font-semibold text-slate-800">
        ยังไม่มี session
      </h3>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        เริ่ม session ใหม่เพื่อจด requirement · decision · open question
        <br />
        แล้ว promote เป็น task ลงบอร์ดเมื่อพร้อม
      </p>
      <button
        type="button"
        onClick={onCreate}
        disabled={creating}
        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        <Plus size={14} />
        New Session
      </button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 h-7 w-40" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

function defaultSessionTitle() {
  const d = new Date();
  return `Session — ${d.toLocaleDateString("th-TH", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

// Group by "this week / earlier this month / older". Sessions list is small
// (handful per project) so this naive scan beats sorting once + bucketing.
function groupSessions(sessions: PlanningSessionSummary[]) {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(now.getDate() - 7);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const buckets: Record<string, PlanningSessionSummary[]> = {
    "This week": [],
    "Earlier this month": [],
    Older: [],
  };

  for (const s of sessions) {
    const when = new Date(s.meeting_at ?? s.updated_at);
    if (when >= weekAgo) buckets["This week"].push(s);
    else if (when >= monthStart) buckets["Earlier this month"].push(s);
    else buckets.Older.push(s);
  }

  return Object.entries(buckets)
    .filter(([, v]) => v.length > 0)
    .map(([label, ss]) => ({ label, sessions: ss }));
}
