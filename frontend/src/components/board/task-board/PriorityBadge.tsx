"use client";

import {
  SignalBars,
  type Priority,
} from "@/components/board/task-board/PriorityFilterDropdown";

interface PriorityBadgeProps {
  priority: "low" | "medium" | "high";
  /**
   * "soft" (default) — pastel chip with subtle border. Existing uses
   * (overview list, board drag preview, my-tasks row) keep this look.
   * "filled" — saturated chip with white text, used on the redesigned
   * board task card where the priority needs to read at a glance from
   * across the column. Color hexes match priority.* tokens in design.md.
   */
  variant?: "soft" | "filled";
}

const SOFT: Record<PriorityBadgeProps["priority"], string> = {
  high: "bg-red-50 text-red-700 border-red-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
};

const FILLED: Record<PriorityBadgeProps["priority"], string> = {
  high: "bg-red-600 text-white border-red-600",
  medium: "bg-amber-500 text-white border-amber-500",
  low: "bg-emerald-500 text-white border-emerald-500",
};

export function PriorityBadge({ priority, variant = "soft" }: PriorityBadgeProps) {
  const palette = variant === "filled" ? FILLED : SOFT;
  return (
    <span
      className={`text-[10px] flex items-center leading-none justify-center gap-1 font-bold uppercase px-2 py-0.5 rounded border w-fit ${palette[priority]}`}
    >
      <SignalBars priority={priority as Priority} size={12} />
      <span>{priority}</span>
    </span>
  );
}
