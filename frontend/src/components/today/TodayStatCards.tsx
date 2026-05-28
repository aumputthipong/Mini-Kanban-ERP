"use client";

interface TodayStatCardsProps {
  overdue: number;
  today: number;
  tomorrow: number;
}

interface CardProps {
  value: number;
  label: string;
  tone: "danger" | "warn" | "neutral";
}

function StatCard({ value, label, tone }: CardProps) {
  const toneCls =
    tone === "danger"
      ? "text-rose-700 bg-rose-50 border-rose-100"
      : tone === "warn"
        ? "text-amber-700 bg-amber-50 border-amber-100"
        : "text-slate-700 bg-slate-50 border-slate-200";
  return (
    <div
      className={`flex flex-col items-center justify-center min-w-20 px-4 py-3 rounded-lg border ${toneCls}`}
    >
      <span className="text-2xl font-bold tabular-nums leading-none">{value}</span>
      <span className="text-[11px] font-semibold mt-1">{label}</span>
    </div>
  );
}

export function TodayStatCards({ overdue, today, tomorrow }: TodayStatCardsProps) {
  return (
    <div className="flex gap-3">
      <StatCard value={overdue} label="เลยกำหนด" tone="danger" />
      <StatCard value={today} label="วันนี้" tone="warn" />
      <StatCard value={tomorrow} label="พรุ่งนี้" tone="neutral" />
    </div>
  );
}
