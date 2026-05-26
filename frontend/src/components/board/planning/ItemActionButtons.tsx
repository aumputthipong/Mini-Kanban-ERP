"use client";

// ItemActionButtons — the trailing cluster of icon buttons on each row:
//   - select (toggle status → "selected")
//   - drop / restore (toggle status → "dropped")
//   - delete
//   - chevron (toggle details panel)
//
// Visibility follows the row-level convention: the whole group sits at
// opacity-60 by default and lifts to full opacity on row hover so the
// buttons read as actionable without screaming for attention when the
// user is just scanning the list.
import { Ban, CheckSquare, ChevronDown, ChevronRight, Square, Trash2 } from "lucide-react";

interface Props {
  selected: boolean;
  dropped: boolean;
  promoted: boolean;
  expanded: boolean;
  hasDetails: boolean;
  onToggleSelected: () => void;
  onToggleDropped: () => void;
  onDelete: () => void;
  onToggleExpanded: () => void;
}

export function ItemActionButtons({
  selected,
  dropped,
  promoted,
  expanded,
  hasDetails,
  onToggleSelected,
  onToggleDropped,
  onDelete,
  onToggleExpanded,
}: Props) {
  return (
    <div className="flex shrink-0 items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleSelected();
        }}
        disabled={promoted || dropped}
        title={selected ? "ยกเลิกการเลือก" : "เลือกเพื่อส่งเข้า Board"}
        aria-label={selected ? "ยกเลิกการเลือก" : "เลือก"}
        className={`rounded p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
          selected
            ? "text-indigo-600 hover:bg-indigo-50"
            : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        }`}
      >
        {selected ? <CheckSquare size={14} /> : <Square size={14} />}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleDropped();
        }}
        disabled={promoted}
        title={dropped ? "เอากลับมา" : "พักไว้ก่อน"}
        aria-label={dropped ? "เอากลับมา" : "พักไว้ก่อน"}
        className={`rounded p-1 transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
          dropped
            ? "text-amber-600 hover:bg-amber-50"
            : "text-slate-400 hover:bg-slate-200 hover:text-slate-700"
        }`}
      >
        <Ban size={14} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="ลบรายการนี้"
        aria-label="ลบ"
        className="rounded p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 size={14} />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleExpanded();
        }}
        title={expanded ? "ซ่อนรายละเอียด" : "เปิดรายละเอียด"}
        aria-label="รายละเอียด"
        aria-expanded={expanded}
        className={`rounded p-1 transition-colors hover:bg-slate-200 ${
          hasDetails ? "text-indigo-600" : "text-slate-400 hover:text-slate-700"
        }`}
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
      </button>
    </div>
  );
}
