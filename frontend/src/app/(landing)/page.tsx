// app/(landing)/page.tsx
// Hybrid landing — adapted from the design handoff but re-skinned with the
// product's slate + blue palette so it feels of a piece with the rest of the app.
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Calendar, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Turtask — Less standup. More shipping.",
  description: "Real-time Kanban workspace. Drag a card, watch it travel.",
};

// ─── Atoms ────────────────────────────────────────────────────────────────────

function Avatar({
  initial,
  className = "bg-blue-600",
  size = 24,
}: {
  initial: string;
  className?: string;
  size?: number;
}) {
  return (
    <span
      className={`rounded-full grid place-items-center text-white font-semibold ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initial}
    </span>
  );
}

const PRIORITY = {
  HIGH: "bg-rose-50 text-rose-700 border-rose-200",
  MEDIUM: "bg-amber-50 text-amber-700 border-amber-200",
  LOW: "bg-emerald-50 text-emerald-700 border-emerald-200",
} as const;

interface TaskCardProps {
  priority?: keyof typeof PRIORITY;
  title: string;
  subtasks?: string[];
  done?: boolean[];
  date?: string;
  hours?: string;
  avatarInitial?: string;
  avatarClass?: string;
  strike?: boolean;
  progress?: number;
}

function TaskCard({
  priority = "MEDIUM",
  title,
  subtasks = [],
  done = [],
  date = "Apr 18",
  hours = "4h",
  avatarInitial = "A",
  avatarClass = "bg-blue-600",
  strike = false,
  progress = 0.66,
}: TaskCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col gap-2">
      <span
        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border w-fit ${PRIORITY[priority]}`}
      >
        {priority.toLowerCase()}
      </span>
      <p
        className={`text-sm font-semibold leading-snug ${
          strike ? "text-slate-400 line-through" : "text-slate-800"
        }`}
      >
        {title}
      </p>

      {subtasks.length > 0 && !strike && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-100 rounded-full h-1 overflow-hidden">
              <div
                className="h-1 rounded-full bg-blue-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-slate-400">
              {done.filter(Boolean).length}/{subtasks.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1 text-xs">
            {subtasks.map((s, i) => (
              <li
                key={i}
                className={`flex items-center gap-2 ${
                  done[i] ? "text-slate-400 line-through" : "text-slate-600"
                }`}
              >
                <span
                  className={`w-3 h-3 rounded-sm border grid place-items-center shrink-0 ${
                    done[i]
                      ? "bg-blue-600 border-blue-600"
                      : "bg-white border-slate-300"
                  }`}
                >
                  {done[i] && (
                    <svg width="8" height="8" viewBox="0 0 8 8">
                      <path
                        d="M1 4l2 2 4-4"
                        stroke="white"
                        strokeWidth="1.5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>
                {s}
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
        <span className="flex items-center gap-2">
          <span className="flex items-center gap-1">
            <Calendar size={10} /> {date}
          </span>
          {hours && (
            <span className="flex items-center gap-1">
              <Clock size={10} /> {hours}
            </span>
          )}
        </span>
        <Avatar initial={avatarInitial} className={avatarClass} size={22} />
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    n: "Step 01",
    title: "Lay out the work.",
    body: "Spin up a project, define columns to match your workflow — sprint, content ops, bug triage. Drop cards in.",
  },
  {
    n: "Step 02",
    title: "Drag, assign, sync.",
    body: "Drag cards across stages. Subtasks, priorities, due dates — every change broadcasts to the team in real time.",
  },
  {
    n: "Step 03",
    title: "Read the workload.",
    body: "The Overview tab does the math. Workload, burn-down, bottlenecks — surfaced before they become a meeting.",
  },
] as const;

export default function LandingPage() {
  return (
    <div className="bg-white text-slate-900 font-sans">
      {/* HERO */}
      <section className="px-6 md:px-12 pt-16 pb-24 max-w-6xl mx-auto">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-8 font-medium">
          <span>A field manual for shipping</span>
          <span>April 2026 · v2.4</span>
        </div>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-12 lg:gap-16 items-center">
          {/* Left — copy + CTA */}
          <div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05]">
              Less standup.
              <br />
              More <span className="text-blue-600">shipping.</span>
            </h1>

            <p className="mt-8 text-base md:text-lg text-slate-500 leading-relaxed max-w-md">
              Turtask is a real-time Kanban workspace. Drag a card, watch it
              travel. Tag a teammate, watch them respond. The board IS the
              meeting — and the meeting is finally short.
            </p>

            <Link
              href="/dashboard"
              className="mt-10 inline-flex items-center gap-2 bg-blue-600 text-white px-7 py-3.5 font-semibold text-sm hover:bg-blue-700 active:scale-95 shadow-sm rounded-full transition-colors"
            >
              Open Workspace
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Right — two stacked task cards, slightly tilted */}
          <div className="relative h-80 lg:h-96 hidden md:block">
            <div className="absolute top-0 right-0 w-60 rotate-3 shadow-xl shadow-slate-900/15">
              <TaskCard
                priority="MEDIUM"
                title="Design API for auth system"
                subtasks={["Endpoint spec", "Token flow", "Wire to FE"]}
                done={[true, true, false]}
                progress={0.66}
                avatarInitial="A"
              />
            </div>
            <div className="absolute bottom-0 left-0 w-56 -rotate-3 shadow-xl shadow-slate-900/10">
              <TaskCard
                priority="HIGH"
                title="Setup Postgres on prod"
                date="Apr 15"
                strike
                avatarInitial="N"
                avatarClass="bg-emerald-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE — Kanban app frame */}
      <section className="bg-slate-50 border-y border-slate-200 px-6 md:px-12 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-2">
                In view
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                The board, <span className="text-blue-600">at a glance.</span>
              </h2>
            </div>
            <span className="hidden md:inline text-xs text-slate-400 font-medium">
              Live preview · drag to move
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 overflow-hidden">
            {/* App bar */}
            <div className="flex items-center gap-6 px-5 py-3 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <span className="w-5 h-5 rounded bg-blue-600 grid place-items-center text-white text-[10px] font-black">
                  K
                </span>
                Project Board
              </div>
              <span className="text-sm text-slate-500">Overview</span>
              <span className="text-sm font-semibold text-blue-600 border-b-2 border-blue-600 pb-1">
                Board
              </span>
              <span className="text-sm text-slate-500">Members</span>
              <span className="text-sm text-slate-500">Calendar</span>
              <div className="ml-auto flex items-center gap-2">
                <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live
                </span>
                <Avatar initial="A" className="bg-blue-600" />
                <Avatar initial="J" className="bg-rose-500" />
                <Avatar initial="M" className="bg-emerald-500" />
              </div>
            </div>

            {/* Body: sidebar + columns */}
            <div className="grid grid-cols-[200px_1fr] min-h-115">
              <aside className="bg-slate-50 border-r border-slate-200 p-4 text-sm">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Workspace
                </div>
                <div className="px-2.5 py-2 text-slate-700">All Boards</div>
                <div className="px-2.5 py-2 text-slate-700">My Tasks</div>

                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 mt-5 mb-2">
                  Projects
                </div>
                <div className="px-2.5 py-2 rounded-lg bg-blue-50 text-blue-700 font-semibold">
                  Kanban Management
                </div>
                <div className="px-2.5 py-2 text-slate-700">
                  Turtask Management
                </div>
              </aside>

              <div className="p-5 bg-white">
                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-medium rounded-full border border-slate-200 bg-white text-slate-600"
                  >
                    My Tasks
                  </button>
                  <button
                    type="button"
                    className="px-3 py-1.5 text-xs font-medium rounded-full bg-slate-900 text-white"
                  >
                    All
                  </button>
                  <Avatar initial="A" className="bg-blue-600" size={22} />
                  <Avatar initial="J" className="bg-rose-500" size={22} />
                  <Avatar initial="M" className="bg-emerald-500" size={22} />
                  <span className="ml-auto text-xs text-slate-500">
                    + Add column
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  {/* To Do */}
                  <div className="bg-slate-100 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-sm font-semibold text-slate-700">
                        To Do
                      </span>
                      <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                        8
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <TaskCard
                        priority="MEDIUM"
                        title="OAuth login"
                        subtasks={["Setup provider", "Token flow"]}
                        done={[true, false]}
                        progress={0.5}
                        avatarInitial="A"
                      />
                      <TaskCard
                        priority="LOW"
                        title="Comment task"
                        avatarInitial="A"
                      />
                    </div>
                  </div>

                  {/* In Progress (highlighted) */}
                  <div className="bg-blue-50 rounded-xl p-3 border border-blue-200">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-sm font-semibold text-blue-700">
                        In Progress
                      </span>
                      <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.5 rounded-full">
                        1
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <TaskCard
                        priority="MEDIUM"
                        title="Dashboard data"
                        subtasks={["Schema", "API contract", "FE hookup", "Tests"]}
                        done={[true, true, true, false]}
                        progress={0.75}
                        avatarInitial="A"
                      />
                      <div className="h-20 border-2 border-dashed border-blue-400 rounded-lg grid place-items-center text-blue-600 text-xs font-semibold">
                        ↓ Drop here
                      </div>
                    </div>
                  </div>

                  {/* Test */}
                  <div className="bg-slate-100 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-sm font-semibold text-slate-700">
                        Test
                      </span>
                      <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                        2
                      </span>
                    </div>
                    <TaskCard
                      priority="HIGH"
                      title="Modal task"
                      subtasks={["Edge cases", "Keyboard nav", "A11y", "Snapshots"]}
                      done={[true, true, true, true]}
                      progress={1}
                      avatarInitial="J"
                      avatarClass="bg-rose-500"
                    />
                  </div>

                  {/* Done */}
                  <div className="bg-slate-100 rounded-xl p-3 border border-slate-200">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-sm font-semibold text-slate-700">
                        Done
                      </span>
                      <span className="text-[10px] font-bold bg-slate-900 text-white px-2 py-0.5 rounded-full">
                        12
                      </span>
                    </div>
                    <div className="flex flex-col gap-2">
                      <TaskCard
                        priority="MEDIUM"
                        title="Card position fix"
                        strike
                        avatarInitial="N"
                        avatarClass="bg-emerald-500"
                      />
                      <TaskCard
                        priority="LOW"
                        title="Login session"
                        strike
                        avatarInitial="N"
                        avatarClass="bg-emerald-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STEPS */}
      <section className="px-6 md:px-12 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-widest text-blue-600 mb-2">
                Method
              </div>
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight">
                Three motions. <span className="text-blue-600">That&apos;s it.</span>
              </h2>
            </div>
            <span className="hidden md:inline text-xs text-slate-400 font-medium">
              03 steps · ~4 min read
            </span>
          </div>

          <div className="border-t border-slate-200">
            {STEPS.map((x, i) => (
              <div
                key={x.n}
                className="grid grid-cols-1 md:grid-cols-[100px_1.2fr_1.8fr_1fr] gap-6 md:gap-10 py-10 border-b border-slate-200 items-center"
              >
                <div className="text-xs font-semibold text-blue-600 uppercase tracking-widest">
                  {x.n}
                </div>
                <h3 className="text-2xl font-bold text-slate-800 tracking-tight leading-tight">
                  {x.title}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">{x.body}</p>

                {/* Mini illustrations */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 h-24 flex items-center justify-center gap-2">
                  {i === 0 && (
                    <>
                      <div className="w-9 h-12 bg-white rounded border border-slate-200" />
                      <div className="w-9 h-12 bg-white rounded border border-slate-200" />
                      <div className="w-9 h-12 bg-white rounded border border-slate-200" />
                      <div className="w-9 h-12 bg-blue-50 rounded border-2 border-dashed border-blue-400" />
                    </>
                  )}
                  {i === 1 && (
                    <>
                      <div className="w-14 h-10 bg-white border border-slate-200 rounded grid place-items-center">
                        <div className="w-8 h-1 bg-slate-200 rounded" />
                      </div>
                      <span className="text-blue-600 text-xl">→</span>
                      <div className="w-14 h-10 bg-blue-50 border border-blue-400 rounded grid place-items-center">
                        <div className="w-8 h-1 bg-blue-500 rounded" />
                      </div>
                    </>
                  )}
                  {i === 2 && (
                    <div className="w-full flex flex-col gap-2 px-2">
                      {[
                        { pct: 52, c: "bg-blue-500" },
                        { pct: 78, c: "bg-emerald-500" },
                        { pct: 23, c: "bg-rose-500" },
                      ].map((p) => (
                        <div
                          key={p.pct}
                          className="flex items-center gap-2"
                        >
                          <span className="text-[10px] text-slate-500 w-7 font-medium">
                            {p.pct}%
                          </span>
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${p.c}`}
                              style={{ width: `${p.pct}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-100 px-6 md:px-12 pt-16 pb-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-[0.95] pb-12 border-b border-slate-800">
            Tasks sorted.
            <br />
            Team <span className="text-blue-400">synced.</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 pt-10 text-xs">
            <div className="md:col-span-1">
              <div className="text-blue-400 font-semibold uppercase tracking-widest mb-3">
                Turtask
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Real-time Kanban for teams that ship.
                <br />
                Built in Bangkok.
              </p>
            </div>
            <div>
              <div className="text-blue-400 font-semibold uppercase tracking-widest mb-3">
                Product
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li>Boards</li>
                <li>Workload</li>
                <li>Calendar</li>
              </ul>
            </div>
            <div>
              <div className="text-blue-400 font-semibold uppercase tracking-widest mb-3">
                Company
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li>About</li>
                <li>Changelog</li>
                <li>Hiring</li>
              </ul>
            </div>
            <div>
              <div className="text-blue-400 font-semibold uppercase tracking-widest mb-3">
                Resources
              </div>
              <ul className="space-y-1.5 text-slate-300">
                <li>Docs</li>
                <li>Guides</li>
                <li>Support</li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-4 border-t border-slate-800 flex justify-between text-[11px] text-slate-500 font-medium">
            <span>© 2026 Turtask Labs</span>
            <span>v2.4.1 · 2026-04-28</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
