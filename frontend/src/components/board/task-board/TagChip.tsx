"use client";

import { X } from "lucide-react";
import type { Tag } from "@/types/board";
import { getColumnColorHex } from "./ColumnOptionsModal";

interface TagChipProps {
  tag: Tag;
  onRemove?: (tagId: string) => void;
}

export function TagChip({ tag, onRemove }: TagChipProps) {
  const hex = getColumnColorHex(tag.color);
  const bg = hex ? `${hex}26` : "#f1f5f9";
  const border = hex ?? "#cbd5e1";
  const text = hex ?? "#64748b";

  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border w-fit"
      style={{ backgroundColor: bg, borderColor: border, color: text }}
    >
      {tag.name}
      {onRemove && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(tag.id);
          }}
          className="ml-0.5 hover:opacity-70 transition-opacity cursor-pointer"
        >
          <X size={8} strokeWidth={3} />
        </button>
      )}
    </span>
  );
}
