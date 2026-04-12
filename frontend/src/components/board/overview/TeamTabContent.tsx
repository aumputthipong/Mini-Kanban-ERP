"use client";

import { Users, Activity } from "lucide-react";

interface WorkloadUser {
  name: string;
  count: number;
}

interface MockActivity {
  id: number;
  actor: string;
  action: string;
  target: string;
  dest: string;
  time: string;
  color: string;
}

const MOCK_ACTIVITY: MockActivity[] = [
  { id: 1, actor: "Aumputthipong", action: "moved", target: "Fix login bug", dest: "Done", time: "2m ago", color: "bg-emerald-500" },
  { id: 2, actor: "Napatpong", action: "added", target: "Write API docs", dest: "To Do", time: "14m ago", color: "bg-blue-500" },
  { id: 3, actor: "Aumputthipong", action: "updated", target: "Deploy to staging", dest: "In Progress", time: "1h ago", color: "bg-violet-500" },
  { id: 4, actor: "Sirinapa", action: "commented on", target: "Design new dashboard", dest: "", time: "3h ago", color: "bg-rose-500" },
  { id: 5, actor: "Napatpong", action: "moved", target: "Code review PR #42", dest: "In Review", time: "5h ago", color: "bg-amber-500" },
];

interface TeamTabContentProps {
  workload: WorkloadUser[];
}

export function TeamTabContent({ workload }: TeamTabContentProps) {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {workload.map((user, index) => {
              const maxCount = workload[0].count;
              const barWidth = Math.max(8, Math.round((user.count / maxCount) * 100));
              const isHeavy = user.count >= 5;
              return (
                <div key={index} className="flex flex-col gap-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-700 truncate">{user.name}</span>
                    <span className={`font-bold text-xs ${isHeavy ? "text-red-500" : "text-slate-500"}`}>
                      {user.count} tasks{isHeavy ? " ⚠️" : ""}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${isHeavy ? "bg-red-400" : "bg-blue-400"}`}
                      style={{ width: `${barWidth}%` }}
                    />
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
            <Activity size={15} className="text-slate-400" />
            <h3 className="text-sm font-bold text-slate-600 uppercase tracking-wide">
              Activity
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">
            Mock
          </span>
        </div>
        <ul className="space-y-3">
          {MOCK_ACTIVITY.map((event) => (
            <li key={event.id} className="flex items-start gap-3">
              <div
                className={`w-6 h-6 rounded-full ${event.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0 mt-0.5`}
              >
                {event.actor[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-700 leading-snug">
                  <span className="font-semibold">{event.actor}</span>{" "}
                  {event.action}{" "}
                  <span className="font-medium text-slate-800">
                    &ldquo;{event.target}&rdquo;
                  </span>
                  {event.dest && (
                    <> → <span className="text-indigo-600 font-medium">{event.dest}</span></>
                  )}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{event.time}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
