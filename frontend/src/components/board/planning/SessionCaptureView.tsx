"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Download, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSessionItems } from "@/hooks/useSessionItems";
import type { PlanningItemType } from "@/types/planning";
import { CaptureInput } from "./CaptureInput";
import { ExportDialog } from "./ExportDialog";
import { ItemRow } from "./ItemRow";
import { SessionSidebar } from "./SessionSidebar";
import { formatRelativeFromNow } from "./planningFormat";

interface Props {
  boardId: string;
  sessionId: string;
}

// The capture surface. Single text input at the bottom (Enter commits as new
// item) plus a segmented control for choosing the item type. All other
// actions — Select / Drop / Delete — are click-only buttons on each row.
//
// Keyboard support is intentionally minimal (Enter / Esc / arrows). Earlier
// versions used ⌘1-3 / ⌘D / ⌘S / ⌘↵ but every one of those collides with a
// browser default (tab switching / bookmark / save / new line), which made
// the shortcuts unreliable and the wider UX feel like it required a manual.
//
// Items state + mutations live in useSessionItems. This component only owns
// the local UI state (draft text, current type, which row is focused, export
// modal open/close) plus the layout.
export function SessionCaptureView({ boardId, sessionId }: Props) {
  const {
    detail,
    items,
    savedAt,
    stats,
    promotedItems,
    commitNew,
    patchItem,
    toggleStatus,
    changeType,
    removeItem,
    promoteSelected,
  } = useSessionItems(boardId, sessionId);

  const [newType, setNewType] = useState<PlanningItemType>("REQ");
  const [draft, setDraft] = useState("");
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const [showExport, setShowExport] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (!detail) {
    return <CaptureSkeleton />;
  }

  const handleCommit = async () => {
    if (!draft.trim()) return;
    const title = draft;
    setDraft("");
    await commitNew(title, newType);
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <Link
          href={`/board/${boardId}/planning`}
          className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800"
        >
          <ChevronLeft size={14} /> Planning
        </Link>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowExport(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Download size={14} /> ส่งออก
          </button>
          <button
            type="button"
            onClick={promoteSelected}
            disabled={stats.selected === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            <ArrowRight size={14} />
            ส่งเข้า Board
            {stats.selected > 0 && <span>({stats.selected})</span>}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Main capture column */}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            {detail.title}
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            {detail.label && <>{detail.label} · </>}
            {savedAt && <>บันทึกอัตโนมัติแล้ว · {formatRelativeFromNow(savedAt)}</>}
          </p>

          <div className="mt-4 flex flex-col gap-1">
            {items.length === 0 && (
              <p className="rounded border border-dashed border-slate-300 bg-slate-50/40 p-6 text-center text-sm text-slate-400">
                ลองเริ่มที่ช่องด้านล่าง · พิมพ์แล้วกด Enter
              </p>
            )}
            {items.map((it, i) => (
              <ItemRow
                key={it.id}
                index={i}
                item={it}
                focused={focusIndex === i}
                onFocus={() => setFocusIndex(i)}
                onChangeType={(t) => changeType(it, t)}
                onChangeTitle={(title) =>
                  patchItem(it.id, { title }, { title })
                }
                onToggleStatus={(s) => toggleStatus(it, s)}
                onDelete={() => removeItem(it)}
                onUp={() => setFocusIndex(Math.max(0, i - 1))}
                onDown={() => {
                  if (i + 1 >= items.length) {
                    setFocusIndex(-1);
                    inputRef.current?.focus();
                  } else {
                    setFocusIndex(i + 1);
                  }
                }}
              />
            ))}
          </div>

          <CaptureInput
            inputRef={inputRef}
            draft={draft}
            onDraftChange={setDraft}
            newType={newType}
            onTypeChange={setNewType}
            onCommit={handleCommit}
            onJumpToList={() => {
              if (items.length > 0) setFocusIndex(items.length - 1);
            }}
          />
        </div>

        <SessionSidebar stats={stats} promotedItems={promotedItems} />
      </div>

      {showExport && (
        <ExportDialog
          session={detail}
          items={items}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}

function CaptureSkeleton() {
  return (
    <div>
      <Skeleton className="mb-2 h-4 w-32" />
      <Skeleton className="mb-1 h-7 w-72" />
      <Skeleton className="mb-6 h-4 w-48" />
      <div className="flex flex-col gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-7 w-full" />
        ))}
      </div>
    </div>
  );
}
