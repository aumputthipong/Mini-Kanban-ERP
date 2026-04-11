"use client";

import { SectionTitle } from "../dashboard/BoardDashboard";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingDown } from "lucide-react";

interface BurndownChartWidgetProps {
  totalCards: number;
  doneCount: number;
}

function buildBurndownData(totalCards: number, doneCount: number) {
  const days = 14;
  const data = [];
  for (let i = 0; i <= days; i++) {
    const ideal = Math.round(totalCards - (totalCards / days) * i);
    // actual: roughly tracks done count approaching end
    const actualRemaining =
      i <= days * 0.6
        ? totalCards - Math.round((doneCount * 0.3 * i) / days)
        : totalCards -
          Math.round(
            doneCount * (0.3 + (0.7 * (i - days * 0.6)) / (days * 0.4)),
          );
    data.push({
      day: `D${i}`,
      ideal: Math.max(0, ideal),
      actual:
        i === days ? totalCards - doneCount : Math.max(0, actualRemaining),
    });
  }
  return data;
}
export function BurndownChartWidget({
  totalCards,
  doneCount,
}: BurndownChartWidgetProps) {
  const burndownData = buildBurndownData(totalCards, doneCount);
  return (
    <div className="lg:col-span-2">
      {/* Burndown Chart */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 ">
        <div className="flex items-start justify-between mb-3">
          <SectionTitle
            icon={<TrendingDown size={15} />}
            label="Burn-down Chart"
          />
          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded font-medium">
            Mock — 14-day sprint
          </span>
        </div>
        <ResponsiveContainer width="100%" height={170}>
          <LineChart
            data={burndownData}
            margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="day"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              interval={1}
            />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: "1px solid #e2e8f0",
              }}
              formatter={(value, name) => [
                `${value} tasks remaining`,
                (name as string) === "ideal" ? "Ideal" : "Actual",
              ]}
            />
            <Line
              type="monotone"
              dataKey="ideal"
              stroke="#cbd5e1"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="#6366f1"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-1">
          <div className="flex items-center gap-1.5">
            <div
              className="w-5 h-0.5 bg-slate-300 border-dashed"
              style={{ borderTop: "2px dashed #cbd5e1" }}
            />
            <span className="text-[11px] text-slate-400">Ideal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-0.5 bg-indigo-500 rounded" />
            <span className="text-[11px] text-slate-400">Actual</span>
          </div>
        </div>
      </div>

    </div>
  );
}
