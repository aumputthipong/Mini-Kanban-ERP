"use client";

import { Sun } from "lucide-react";

interface MyWorkGreetingProps {
  fullName?: string | null;
  todayCount: number;
  overdueCount: number;
  doneToday: number;
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

export function MyWorkGreeting({ fullName, todayCount, overdueCount, doneToday }: MyWorkGreetingProps) {
  const now = new Date();
  const display = fullName?.split(" ")[0] ?? "คุณ";

  return (
    <header className="min-w-0">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
        <Sun size={13} className="text-amber-500" />
        <span className="whitespace-nowrap">{thaiDate(now)}</span>
      </div>
      <h1 className="text-[25px] leading-[1.05] font-extrabold tracking-tight text-slate-900 mb-1">
        {greetingByHour(now.getHours())}, <span className="text-blue-700">{display}</span>
      </h1>
      <p className="text-sm text-slate-600 truncate">
        {renderSummary(todayCount, overdueCount, doneToday)}
      </p>
    </header>
  );
}

const overdueNote = (overdueCount: number) =>
  overdueCount > 0 ? (
    <>
      {" · "}
      <span className="font-bold text-rose-700">มี {overdueCount} งานเลยกำหนด</span> รอจัดการ
    </>
  ) : null;

function renderSummary(todayCount: number, overdueCount: number, doneToday: number) {
  if (todayCount === 0) {
    if (overdueCount === 0) return "วันนี้ไม่มีงานในรายการ ใช้เวลาวางแผนหรือพักผ่อน";
    return <>วันนี้ยังไม่มีงานที่ตั้งไว้{overdueNote(overdueCount)}</>;
  }
  return (
    <>
      โฟกัสวันนี้ <b className="font-semibold text-slate-900">{todayCount} งาน</b> · เสร็จแล้ว{" "}
      <b className="font-semibold text-slate-900">{doneToday}</b>
      {overdueNote(overdueCount)}
    </>
  );
}
