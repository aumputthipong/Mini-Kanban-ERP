"use client";

import { Sun } from "lucide-react";

interface TodayGreetingProps {
  fullName?: string | null;
  todayCount: number;
  overdueCount: number;
}

function greetingByHour(hour: number): string {
  if (hour < 12) return "สวัสดีตอนเช้า";
  if (hour < 17) return "สวัสดีตอนบ่าย";
  return "สวัสดีตอนเย็น";
}

function thaiDate(now: Date): string {
  const weekday = now.toLocaleDateString("th-TH", { weekday: "long" });
  const day = now.getDate();
  const month = now.toLocaleDateString("th-TH", { month: "short" });
  const year = now.getFullYear() + 543;
  return `${weekday} · ${day} ${month} ${year}`;
}

export function TodayGreeting({ fullName, todayCount, overdueCount }: TodayGreetingProps) {
  const now = new Date();
  const display = fullName?.split(" ")[0] ?? "คุณ";
  const summary =
    todayCount === 0 && overdueCount === 0
      ? "วันนี้ไม่มีงานในรายการ ใช้เวลาวางแผนหรือพักผ่อน"
      : overdueCount > 0
        ? `วันนี้คุณมี ${todayCount} งาน ต้องทำ และมี ${overdueCount} งานเลยกำหนด รออยู่`
        : `วันนี้คุณมี ${todayCount} งานต้องทำ — ค่อยๆ ทำให้เสร็จ`;

  return (
    <header className="mb-6">
      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
        <Sun size={12} className="text-amber-500" />
        <span>{thaiDate(now)}</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
        {greetingByHour(now.getHours())}, {display}
      </h1>
      <p className="text-sm text-slate-500 mt-1">{summary}</p>
    </header>
  );
}
