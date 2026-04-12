"use client";

import { CheckCircle2, BarChart3, Clock, Zap } from "lucide-react";
import PieChartWidget from "./PieChartWidget";
import { BurndownChartWidget } from "./BurndownChartWidget";

interface ColumnStat {
  title: string;
  count: number;
  category: "TODO" | "DONE";
}

interface OverviewTabContentProps {
  progress: number;
  totalCards: number;
  doneCount: number;
  totalHours: number;
  columnStats: ColumnStat[];
  insights: string[];
}

export function OverviewTabContent({
  progress,
  totalCards,
  doneCount,
  totalHours,
  columnStats,
  insights,
}: OverviewTabContentProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Stats strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-emerald-50 rounded-lg">
            <CheckCircle2 size={20} className="text-emerald-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800">{progress}%</p>
            <p className="text-xs text-slate-400 font-medium">Completion</p>
          </div>
          <div className="flex-1 bg-slate-100 h-1.5 rounded-full ml-auto overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-blue-50 rounded-lg">
            <BarChart3 size={20} className="text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800">{totalCards}</p>
            <p className="text-xs text-slate-400 font-medium">Total Tasks</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm font-bold text-slate-600">{doneCount}</p>
            <p className="text-[10px] text-slate-400">done</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-2.5 bg-violet-50 rounded-lg">
            <Clock size={20} className="text-violet-500" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-800">{totalHours}</p>
            <p className="text-xs text-slate-400 font-medium">Est. Hours</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <PieChartWidget columnStats={columnStats} />
        <BurndownChartWidget totalCards={totalCards} doneCount={doneCount} />
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Zap size={15} className="text-indigo-600 fill-indigo-500" />
            <h3 className="text-sm font-bold text-indigo-700 uppercase tracking-wide">
              Insights
            </h3>
          </div>
          <ul className="space-y-2.5">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-indigo-900">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1 shrink-0" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
