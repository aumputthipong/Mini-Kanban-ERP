"use client";

import {
  SignalBars,
  type Priority,
} from "@/components/board/task-board/PriorityFilterDropdown";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high";
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  return (
    <span
      className={`text-[10px] flex items-center leading-none justify-center gap-1 font-bold uppercase px-2 py-0.5 rounded border w-fit ${
        priority === "high"
          ? "bg-red-50 text-red-700 border-red-200"
          : priority === "medium"
            ? "bg-amber-50 text-amber-700 border-amber-200"
            : "bg-emerald-50 text-emerald-700 border-emerald-200"
      }`}
    >
      <SignalBars priority={priority as Priority} size={12} />
      <span>{priority}</span>
    </span>
  );
}
