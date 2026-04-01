"use client";

import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatThaiDate, getOverdueText } from "@/ีutils/date_helper";
import {
  AlertCircle,
  Clock,
  Zap,
  CheckCircle2,
  BarChart3,
  AlertTriangle,
} from "lucide-react";

// Helper ฟังก์ชันสำหรับคำนวณและแปลงวันที่เหลือให้อ่านง่าย
// Best Practice: ควรแยก Logic การคำนวณวันเวลาออกจากส่วน UI เพื่อให้อ่านโค้ดง่าย
const getDaysRemainingText = (dueDateStr: string) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dueDate = new Date(dueDateStr);
  dueDate.setHours(0, 0, 0, 0);

  const diffTime = dueDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Due today";
  if (diffDays === 1) return "Due tomorrow";
  return `In ${diffDays} days`;
};

export function BoardDashboard() {
  const stats = useDashboardStats();

  if (stats.totalCards === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
        <BarChart3 size={32} className="mb-2 text-slate-300" />
        <p>No data to analyze. Add some tasks to your board.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-10">
      {/* 1. Smart Insights */}
      <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-xl">
        <div className="flex items-center gap-2 mb-4 text-indigo-800">
          <Zap size={20} className="fill-indigo-600" />
          <h2 className="text-lg font-bold">Smart Insights</h2>
        </div>
        <ul className="space-y-3">
          {stats.insights.map((insight, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm font-medium text-indigo-900"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
              {insight}
            </li>
          ))}
        </ul>
      </div>

      {/* 2. Project Health (โครงสร้างเดิม ขอละไว้เพื่อความกระชับ) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... (ใช้โค้ด Project Progress, Total Hours, Total Tasks ชุดเดิมได้เลย) ... */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <h3 className="text-sm font-semibold">Project Progress</h3>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-extrabold text-slate-800">
              {stats.progress}%
            </p>
            <p className="text-sm text-slate-400 mb-1">Completed</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <h3 className="text-sm font-semibold">Total Estimated Hours</h3>
            <Clock size={16} className="text-blue-500" />
          </div>
          <div className="flex items-end gap-2">
            <p className="text-4xl font-extrabold text-slate-800">
              {stats.totalHours}
            </p>
            <p className="text-sm text-slate-400 mb-1">Hours</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <h3 className="text-sm font-semibold">Total Tasks</h3>
            <BarChart3 size={16} className="text-slate-400" />
          </div>
          <p className="text-4xl font-extrabold text-slate-800">
            {stats.totalCards}
          </p>
        </div>
      </div>

      {/* 3. Actionable Items & Workload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2">
            Needs Attention
          </h3>

          {/* Overdue Tasks -> เปลี่ยนเป็น เลยกำหนดการ */}
          <div className="bg-white border border-red-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-red-50 px-4 py-3 border-b border-red-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                <AlertCircle size={16} /> Overdue Task
              </div>
              <span className="bg-red-200 text-red-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.overdueCards.length}
              </span>
            </div>
            <div className="p-0">
              {stats.overdueCards.map((card) => (
                <li
                  key={card.id}
                  className="p-3 text-sm flex justify-between items-center hover:bg-slate-50"
                >
                  <span className="font-medium text-slate-700 truncate pr-4">
                    {card.title}
                  </span>
                  <div className="flex flex-col items-end">
                    {/* ด้านบน: แสดงจำนวนวันที่เลยกำหนด */}
                    <span className="text-red-600 text-xs font-bold whitespace-nowrap">
                      {getOverdueText(card.due_date!)}
                    </span>
                    {/* ด้านล่าง: แสดงวันที่แบบไทย สีจาง */}
                    <span className="text-slate-400 text-[10px] whitespace-nowrap">
                      {formatThaiDate(card.due_date!)}
                    </span>
                  </div>
                </li>
              ))}
            </div>
          </div>

          {/* Due Soon -> เปลี่ยนเป็น Upcoming Tasks พร้อมคำนวณวัน */}
          <div className="bg-white border border-amber-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-amber-50 px-4 py-3 border-b border-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-700 font-semibold text-sm">
                <AlertTriangle size={16} /> Upcoming Tasks
              </div>
              <span className="bg-amber-200 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                {stats.dueSoonCards.length}
              </span>
            </div>
            <div className="p-0">
              {stats.dueSoonCards.length === 0 ? (
                <p className="text-sm text-slate-400 p-4">
                  ไม่มีงานที่กำลังจะถึงกำหนด
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {stats.dueSoonCards.map((card) => (
                    <li
                      key={card.id}
                      className="p-3 text-sm flex justify-between items-center hover:bg-slate-50"
                    >
                      <span className="font-medium text-slate-700 truncate pr-4">
                        {card.title}
                      </span>
                      <div className="flex flex-col items-end">
                        {/* ด้านบน: แสดงจำนวนวันที่เหลือ */}
                        <span className="text-amber-600 text-xs font-bold whitespace-nowrap">
                          {getDaysRemainingText(card.due_date!)}
                        </span>
                        {/* ด้านล่าง: แสดงวันที่แบบไทย สีจาง */}
                        <span className="text-slate-400 text-[10px] whitespace-nowrap">
                          {formatThaiDate(card.due_date!)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* คอลัมน์ขวา: Active Workload (โค้ดชุดเดิม) */}
        <div className="flex flex-col gap-4">
          <h3 className="text-base font-bold text-slate-800 border-b border-slate-200 pb-2">
            Active Workload
          </h3>
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            {stats.workload.length === 0 ? (
              <p className="text-sm text-slate-400">
                No active tasks assigned to anyone.
              </p>
            ) : (
              <ul className="space-y-4">
                {stats.workload.map((user, index) => {
                  const maxCount = stats.workload[0].count;
                  const barWidth = Math.max(
                    10,
                    Math.round((user.count / maxCount) * 100),
                  );

                  return (
                    <li key={index} className="flex flex-col gap-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-slate-700">
                          {user.name}
                        </span>
                        <span className="text-slate-500 font-semibold">
                          {user.count} tasks
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-blue-500 h-full rounded-full"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
