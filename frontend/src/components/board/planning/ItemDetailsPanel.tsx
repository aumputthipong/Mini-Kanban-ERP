"use client";

// ItemDetailsPanel — the expanded section under an ItemRow that holds the
// two free-text fields surfaced by B-F3:
//   - acceptance_criteria — "เสร็จเมื่อ..." (REQ only — DEC/Q don't have an
//                            obvious AC, surfacing the field would just be
//                            noise on those rows)
//   - implementation_note — "Note สำหรับ dev" (every type)
//
// Editing follows the same optimistic + onBlur-save pattern as the title
// edit on the row itself: local draft, blur → patch, no Save button. Empty
// values are sent as "" so the backend's COALESCE-protected fields can be
// cleared (the parent component decides whether to send the patch at all
// based on whether the value actually changed).
import { useState } from "react";
import type { PlanningItemType } from "@/types/planning";

interface Props {
  itemType: PlanningItemType;
  acceptanceCriteria: string | null | undefined;
  implementationNote: string | null | undefined;
  onChangeAcceptanceCriteria: (value: string) => void;
  onChangeImplementationNote: (value: string) => void;
}

export function ItemDetailsPanel({
  itemType,
  acceptanceCriteria,
  implementationNote,
  onChangeAcceptanceCriteria,
  onChangeImplementationNote,
}: Props) {
  return (
    <div className="ml-8 mt-1 flex flex-col gap-2 rounded border border-slate-200 bg-slate-50/40 p-3">
      {itemType === "REQ" && (
        <AutoSaveTextarea
          label="เสร็จเมื่อ..."
          placeholder={`เช่น "login ด้วย email ได้" (บรรทัดละข้อ)`}
          value={acceptanceCriteria ?? ""}
          onSave={onChangeAcceptanceCriteria}
          minRows={3}
        />
      )}
      <AutoSaveTextarea
        label="Note สำหรับ dev"
        placeholder={`เช่น "ใช้ webhook X", "rate limit Y/min"`}
        value={implementationNote ?? ""}
        onSave={onChangeImplementationNote}
        minRows={2}
      />
    </div>
  );
}

// AutoSaveTextarea — drives a single textarea field with a local draft and
// commits on blur if the value actually changed. The parent only sees the
// new value when it would result in a net change; idempotent re-renders
// from API echo-backs won't trigger a duplicate save.
function AutoSaveTextarea({
  label,
  placeholder,
  value,
  onSave,
  minRows,
}: {
  label: string;
  placeholder: string;
  value: string;
  onSave: (next: string) => void;
  minRows: number;
}) {
  const [draft, setDraft] = useState(value);
  // Track the last server-confirmed value so we can detect prop changes
  // during render without a useEffect+setState (React 19's
  // react-hooks/set-state-in-effect rule). When the parent updates the
  // field (e.g. another tab edited it) we mirror it into local draft
  // before paint — same outcome, no cascading-render warning.
  const [syncedValue, setSyncedValue] = useState(value);
  if (syncedValue !== value) {
    setSyncedValue(value);
    setDraft(value);
  }

  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-semibold text-slate-700">{label}</span>
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onSave(draft);
        }}
        placeholder={placeholder}
        rows={minRows}
        className="resize-y rounded border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-200"
      />
    </label>
  );
}

// countNonEmptyLines returns how many newline-separated lines have any
// non-whitespace content. Used by ItemRow to render an "AC: N ข้อ" badge
// without expanding the panel.
export function countNonEmptyLines(text: string | null | undefined): number {
  if (!text) return 0;
  let count = 0;
  for (const line of text.split("\n")) {
    if (line.trim().length > 0) count += 1;
  }
  return count;
}
