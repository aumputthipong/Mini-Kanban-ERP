// app/(landing)/page.tsx
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  MoreHorizontal,
  Calendar,
  Clock,
  Check,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Turtask — Team Kanban Board",
  description: "Real-time Kanban board for your team",
};

// ─── Hero ─────────────────────────────────────────────────────────────────────

function HeroSection() {
  return (
    <div className="flex-1 max-w-xl z-10">
      {/* Logo + brand */}
      <div className="flex items-center gap-3.5 mb-8">
        <div className="relative w-10 h-10 shrink-0">
          <Image
            src="/Turtask.png"
            alt="Turtask"
            fill
            sizes="40px"
            className="object-contain"
            priority
          />
        </div>
        <span className="text-sm font-semibold text-slate-400 tracking-widest uppercase">
          Turtask
        </span>
      </div>

      {/* Heading */}
      <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] mb-5">
        Tasks sorted. <br />
        <span className="text-blue-600">Team synced.</span>
      </h1>

      {/* Subtext */}
      <p className="text-base text-slate-500 max-w-sm leading-relaxed mb-10">
        A real-time Kanban board built for teams who want to move fast — track
        tasks, monitor workload, and ship together.
      </p>

      {/* CTA */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 bg-blue-600 text-white px-7 py-3.5 font-semibold text-sm hover:bg-blue-700  active:scale-95 shadow-sm rounded-full  transition-colors"
      >
        Open Workspace
        <ArrowRight size={16} />
      </Link>

      <p className="mt-4 text-xs text-slate-400 tracking-wide">
        Real-time sync · Subtasks · Smart overview
      </p>
    </div>
  );
}

// ─── Kanban Preview ───────────────────────────────────────────────────────────

function PreviewKanbanBoard() {
  return (
    <div className="flex-1 relative w-full max-w-xs xl:max-w-sm flex items-start justify-center z-10 mt-12 lg:mt-0">
      {/* Decorative blob */}
      <div className="absolute inset-0 bg-linear-to-tr from-blue-100/60 to-indigo-50/60 rounded-[3rem] rotate-3 scale-105 pointer-events-none" />

      {/* Column */}
      <div className="relative w-full bg-slate-100 p-4 rounded-2xl shadow-xl shadow-blue-900/10 border border-slate-200/60 flex flex-col gap-3">
        {/* Column header */}
        <div className="flex items-center justify-between px-1 pb-1">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-700 text-sm">In Progress</h3>
            <span className="bg-slate-200 text-slate-500 text-xs font-bold px-2 py-0.5 rounded-full">
              2
            </span>
          </div>
          <MoreHorizontal size={16} className="text-slate-400" />
        </div>

        {/* Card 1 — medium priority + subtasks */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3">
          <span className="text-[10px] flex items-center gap-1 font-bold uppercase px-2 py-0.5 rounded border w-fit bg-amber-50 text-amber-700 border-amber-200">
            medium
          </span>
          <p className="text-sm font-semibold text-slate-700 leading-snug">
            Design API for auth system
          </p>
          {/* Subtask progress */}
          <div className="flex flex-col gap-1 pl-1">
            <div className="flex items-center gap-2 mb-0.5">
              <div className="flex-1 bg-slate-100 rounded-full h-1 overflow-hidden">
                <div className="h-1 rounded-full bg-blue-400 w-2/3" />
              </div>
              <span className="text-[10px] font-semibold text-slate-400">
                2/3
              </span>
            </div>
            {[
              { label: "Write endpoint spec", done: true },
              { label: "Test token flow", done: true },
              { label: "Connect to frontend", done: false },
            ].map((st) => (
              <div key={st.label} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={st.done}
                  readOnly
                  className="rounded border-slate-300 text-blue-500 pointer-events-none"
                />
                <span
                  className={`text-xs ${st.done ? "line-through text-slate-400" : "text-slate-600"}`}
                >
                  {st.label}
                </span>
              </div>
            ))}
          </div>
          {/* Footer */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Calendar size={10} /> Apr 18
              </span>
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Clock size={10} /> 4h
              </span>
            </div>
            <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center text-white text-[10px] font-bold">
              A
            </div>
          </div>
        </div>

        {/* Card 2 — high priority, done */}
        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col gap-3 opacity-75">
          <span className="text-[10px] flex items-center gap-1 font-bold uppercase px-2 py-0.5 rounded border w-fit bg-red-50 text-red-700 border-red-200">
            high
          </span>
          <div className="flex items-start gap-3">
            <p className="text-sm font-semibold text-slate-400 line-through leading-snug flex-1">
              Setup PostgreSQL on production
            </p>
            <div className="shrink-0 w-6 h-6 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <Check size={14} strokeWidth={3} />
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Calendar size={10} /> Apr 15
            </span>
            <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[10px] font-bold">
              N
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans">
      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-24 pb-32 flex flex-col lg:flex-row items-center justify-between gap-16">
        <HeroSection />
        <PreviewKanbanBoard />
      </main>
    </div>
  );
}
