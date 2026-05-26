"use client";

import {
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { Ban, CheckSquare, Square, Trash2 } from "lucide-react";
import type {
  PlanningItem,
  PlanningItemStatus,
  PlanningItemType,
} from "@/types/planning";
import {
  TYPE_CHIP,
  TYPE_CHIP_ACTIVE,
  TYPE_CYCLE,
  TYPE_LONG,
  TYPE_TOOLTIP,
} from "./planningTypeMeta";

interface ItemRowProps {
  index: number;
  item: PlanningItem;
  focused: boolean;
  onFocus: () => void;
  onChangeType: (t: PlanningItemType) => void;
  onChangeTitle: (t: string) => void;
  onToggleStatus: (s: PlanningItemStatus) => void;
  onDelete: () => void;
  onUp: () => void;
  onDown: () => void;
}

// One row of the capture surface. Renders the index, the type chip (click
// opens a 3-option popover; the previous cycle-on-click was discoverable
// only by accident and made REQ → DEC a two-click trip for new users), the
// title (click to edit), the status badges, and the three icon-action
// buttons. Click-first; the only keyboard surface is inside the edit input
// (Enter to commit, Escape to cancel, arrows to nav).
export function ItemRow({
  index,
  item,
  focused,
  onFocus,
  onChangeType,
  onChangeTitle,
  onToggleStatus,
  onDelete,
  onUp,
  onDown,
}: ItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [typeMenuOpen, setTypeMenuOpen] = useState(false);
  const typeMenuRef = useRef<HTMLDivElement | null>(null);
  const [draft, setDraft] = useState(item.title);
  // Tracks the last item.title we synced from so we can detect prop changes
  // during render without a useEffect+setState (which trips React 19's
  // react-hooks/set-state-in-effect rule). When the parent updates the
  // title (e.g. WS-driven refresh) we mirror it into local draft *before*
  // rendering — same outcome, no cascading-render warning.
  const [syncedTitle, setSyncedTitle] = useState(item.title);
  const inputRef = useRef<HTMLInputElement | null>(null);

  if (syncedTitle !== item.title) {
    setSyncedTitle(item.title);
    setDraft(item.title);
  }

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  // Close the type menu when the user clicks anywhere outside it. Listening
  // on mousedown (not click) so the menu closes before the outside element
  // gets its own click handler — avoids accidentally toggling row focus or
  // entering edit mode on the very click that dismissed the menu.
  useEffect(() => {
    if (!typeMenuOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (!typeMenuRef.current?.contains(e.target as Node)) {
        setTypeMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [typeMenuOpen]);

  const commit = () => {
    setEditing(false);
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(item.title);
      return;
    }
    if (trimmed !== item.title) onChangeTitle(trimmed);
  };

  // Row-level keys: Enter commits the edit, Escape cancels, arrows navigate.
  // Type / drop / select / delete are click-only.
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setDraft(item.title);
      setEditing(false);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      onUp();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onDown();
      return;
    }
  };

  const promoted = item.status === "promoted";
  const dropped = item.status === "dropped";
  const selected = item.status === "selected";

  return (
    <div
      onClick={onFocus}
      className={`group flex items-center gap-2 rounded px-2 py-1 ${
        focused ? "bg-indigo-50" : "hover:bg-slate-50"
      }`}
    >
      <span className="w-6 shrink-0 text-right text-[10px] text-slate-300">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div ref={typeMenuRef} className="relative shrink-0">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (promoted) return;
            setTypeMenuOpen((open) => !open);
          }}
          className={`rounded border px-1.5 py-0 text-[10px] font-bold uppercase ${TYPE_CHIP[item.type]} ${
            promoted ? "cursor-not-allowed opacity-60" : "hover:brightness-95"
          }`}
          disabled={promoted}
          title={
            promoted
              ? "ส่งเข้า Board แล้ว เปลี่ยนประเภทไม่ได้"
              : `${TYPE_TOOLTIP[item.type]} · คลิกเพื่อเปลี่ยน`
          }
        >
          {item.type}
        </button>
        {typeMenuOpen && (
          <div
            className="absolute left-0 top-full z-10 mt-1 flex gap-1 rounded-md border border-slate-200 bg-white p-1 shadow-md"
            onClick={(e) => e.stopPropagation()}
          >
            {TYPE_CYCLE.map((t) => {
              const active = t === item.type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setTypeMenuOpen(false);
                    if (t !== item.type) onChangeType(t);
                  }}
                  className={`whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-bold uppercase transition-colors ${
                    active ? TYPE_CHIP_ACTIVE[t] : TYPE_CHIP[t]
                  }`}
                  title={TYPE_LONG[t]}
                >
                  {t}
                </button>
              );
            })}
          </div>
        )}
      </div>
      {editing ? (
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKey}
          className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!promoted) setEditing(true);
          }}
          onKeyDown={onKey}
          className={`flex-1 truncate bg-transparent text-left text-sm outline-none focus:ring-0 ${
            dropped
              ? "text-slate-400 line-through"
              : promoted
                ? "text-slate-500"
                : "text-slate-800"
          }`}
        >
          {item.title}
        </button>
      )}
      {selected && (
        <span className="shrink-0 rounded bg-indigo-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-700">
          เลือกแล้ว
        </span>
      )}
      {promoted && item.promoted_to_card_id && (
        <span className="shrink-0 text-[10px] text-indigo-600">→ บนบอร์ดแล้ว</span>
      )}
      {/* Action buttons — always visible at opacity-60 so users see them
          without needing to hover the row first. Lifts to full opacity on
          hover for affordance. Icon-only saves horizontal space; titles
          carry the verbal cue. */}
      <div className="flex shrink-0 items-center gap-0.5 opacity-60 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus("selected");
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
            onToggleStatus("dropped");
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
      </div>
    </div>
  );
}
