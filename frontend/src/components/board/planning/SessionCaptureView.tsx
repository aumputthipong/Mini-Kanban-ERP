"use client";

import {
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Download,
  ArrowRight,
  Trash2,
  CheckSquare,
  Square,
  Ban,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToastStore } from "@/store/useToastStore";
import { planningApi } from "@/lib/planningApi";
import type {
  PlanningItem,
  PlanningItemStatus,
  PlanningItemType,
  PlanningSessionDetail,
} from "@/types/planning";
import { ExportDialog } from "./ExportDialog";
import { formatRelativeFromNow } from "./planningFormat";

interface Props {
  boardId: string;
  sessionId: string;
}

// Full Thai label used in tooltips on the small REQ/DEC/Q chips so a hover
// reveals "what does this code actually mean" — keeps row density compact
// while making the chip self-documenting for new users.
const TYPE_TOOLTIP: Record<PlanningItemType, string> = {
  REQ: "Requirement — สิ่งที่ต้องทำ",
  DEC: "Decision — ที่ตกลงกัน",
  Q: "Question — คำถามที่ยังตอบไม่ได้",
};

// Full Thai label used in the segmented control next to the input. The
// abbreviated codes are kept only on row chips (density) and in the
// sidebar count where users have time to read.
const TYPE_LONG: Record<PlanningItemType, string> = {
  REQ: "Requirement",
  DEC: "Decision",
  Q: "Question",
};

const TYPE_CHIP: Record<PlanningItemType, string> = {
  REQ: "bg-red-50 text-red-700 border-red-200",
  DEC: "bg-blue-50 text-blue-700 border-blue-200",
  Q: "bg-amber-50 text-amber-700 border-amber-200",
};

// Solid (active) styles for the segmented control — match the filled
// priority chip pattern from the calendar pill so the visual vocabulary
// stays consistent across the app.
const TYPE_CHIP_ACTIVE: Record<PlanningItemType, string> = {
  REQ: "bg-red-600 text-white border-red-600",
  DEC: "bg-blue-600 text-white border-blue-600",
  Q: "bg-amber-500 text-white border-amber-500",
};

const TYPE_CYCLE: PlanningItemType[] = ["REQ", "DEC", "Q"];

// The capture surface. Single text input at the bottom (Enter commits as new
// item) plus a segmented control for choosing the item type. All other
// actions — Select / Drop / Delete — are click-only buttons on each row.
//
// Keyboard support is intentionally minimal (Enter / Esc / arrows). Earlier
// versions used ⌘1-3 / ⌘D / ⌘S / ⌘↵ but every one of those collides with a
// browser default (tab switching / bookmark / save / new line), which made
// the shortcuts unreliable and the wider UX feel like it required a manual.
//
// Local state is the source of truth for what the user sees; every mutation
// fires the corresponding API call in the background. We don't wait for the
// server response — capture velocity matters more than confirming success
// for trivial writes, and any error surfaces as a toast via apiClient.
export function SessionCaptureView({ boardId, sessionId }: Props) {
  const router = useRouter();
  const [detail, setDetail] = useState<PlanningSessionDetail | null>(null);
  const [items, setItems] = useState<PlanningItem[]>([]);
  const [newType, setNewType] = useState<PlanningItemType>("REQ");
  const [draft, setDraft] = useState("");
  const [focusIndex, setFocusIndex] = useState<number>(-1);
  const [savedAt, setSavedAt] = useState<string>("");
  const [showExport, setShowExport] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    let cancelled = false;
    planningApi
      .getSession(sessionId)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        setItems(d.items);
        setSavedAt(d.updated_at);
      })
      .catch(() => {
        if (cancelled) return;
        showToast({ message: "โหลดบันทึกไม่ได้", duration: 4000 });
        router.push(`/board/${boardId}/planning`);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, boardId, router, showToast]);

  // Live counts displayed in the right sidebar. Same NOT IN exclusion as
  // the backend's session-summary aggregate so the numbers don't drift.
  const stats = useMemo(() => {
    const s = { REQ: 0, DEC: 0, Q: 0, dropped: 0, promoted: 0, selected: 0 };
    for (const it of items) {
      if (it.status === "dropped") s.dropped++;
      else if (it.status === "promoted") s.promoted++;
      else {
        s[it.type]++;
        if (it.status === "selected") s.selected++;
      }
    }
    return s;
  }, [items]);

  const promotedItems = useMemo(
    () => items.filter((it) => it.status === "promoted"),
    [items],
  );

  // Helpers ------------------------------------------------------

  const patchItem = useCallback(
    (id: string, patch: Partial<PlanningItem>, optimistic: Partial<PlanningItem>) => {
      // Optimistic: write to local state right away, fire-and-forget API.
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...optimistic } : it)));
      setSavedAt(new Date().toISOString());
      planningApi
        .updateItem(id, {
          type: patch.type,
          title: patch.title,
          description: patch.description ?? undefined,
          status: patch.status,
          position: patch.position,
        })
        .catch(() => {
          showToast({ message: "บันทึกไม่สำเร็จ", duration: 4000 });
        });
    },
    [showToast],
  );

  const commitNew = useCallback(async () => {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
    // Optimistic insert. The API call returns the real id; we then swap in
    // place so subsequent edits target the real row, not the placeholder.
    const tempId = `__pending_${Math.random().toString(36).slice(2)}`;
    const placeholder: PlanningItem = {
      id: tempId,
      session_id: sessionId,
      type: newType,
      title,
      description: null,
      status: "live",
      promoted_to_card_id: null,
      position: Number.MAX_SAFE_INTEGER,
      created_at: new Date().toISOString(),
    };
    setItems((prev) => [...prev, placeholder]);
    setSavedAt(placeholder.created_at);
    try {
      const real = await planningApi.createItem(sessionId, {
        type: newType,
        title,
      });
      setItems((prev) => prev.map((it) => (it.id === tempId ? real : it)));
    } catch {
      setItems((prev) => prev.filter((it) => it.id !== tempId));
      showToast({ message: "เพิ่มไม่ได้ ลองอีกครั้ง", duration: 4000 });
    }
  }, [draft, newType, sessionId, showToast]);

  const toggleStatus = useCallback(
    (item: PlanningItem, target: PlanningItemStatus) => {
      // If already in target status, flip back to live.
      const next: PlanningItemStatus = item.status === target ? "live" : target;
      patchItem(item.id, { status: next }, { status: next });
    },
    [patchItem],
  );

  const changeType = useCallback(
    (item: PlanningItem, t: PlanningItemType) => {
      patchItem(item.id, { type: t }, { type: t });
    },
    [patchItem],
  );

  const removeItem = useCallback(
    async (item: PlanningItem) => {
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      try {
        await planningApi.deleteItem(item.id);
      } catch {
        setItems((prev) => [...prev, item]);
        showToast({ message: "ลบไม่ได้ ลองอีกครั้ง", duration: 4000 });
      }
    },
    [showToast],
  );

  const promoteSelected = useCallback(async () => {
    const targets = items.filter((it) => it.status === "selected");
    if (targets.length === 0) {
      showToast({
        message: "ยังไม่ได้เลือกรายการ — กดปุ่มเลือกที่บรรทัดก่อน",
        duration: 3000,
      });
      return;
    }
    // Promote sequentially to keep board card positions stable.
    for (const it of targets) {
      try {
        const res = await planningApi.promoteItem(it.id);
        setItems((prev) =>
          prev.map((cur) => (cur.id === it.id ? res.item : cur)),
        );
      } catch {
        showToast({
          message: `ส่งเข้า Board ไม่ได้: ${it.title}`,
          duration: 4000,
        });
      }
    }
    showToast({
      message: `ส่งเข้า Board แล้ว ${targets.length} รายการ`,
      duration: 3000,
    });
  }, [items, showToast]);

  // Keyboard ------------------------------------------------------

  // Capture input only handles Enter (commit) and ArrowUp (jump into the
  // existing item list). Type switching and promote are click-driven via
  // the segmented control + the Promote button — see the rationale block
  // at the top of the file.
  const onDraftKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitNew();
      return;
    }
    if (e.key === "ArrowUp" && items.length > 0) {
      e.preventDefault();
      setFocusIndex(items.length - 1);
    }
  };

  // Render ------------------------------------------------------

  if (!detail) {
    return <CaptureSkeleton />;
  }

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

          {/* Capture row — segmented type picker + free-text input. Clicking
              one of the three type buttons sets the type and refocuses the
              input, so the user can stay in flow: click → type → Enter. */}
          <div className="mt-4 flex flex-col gap-2 rounded-lg border border-slate-200 bg-white p-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50">
            <div className="flex items-center gap-1.5">
              {TYPE_CYCLE.map((t) => {
                const active = newType === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setNewType(t);
                      inputRef.current?.focus();
                    }}
                    title={TYPE_TOOLTIP[t]}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? TYPE_CHIP_ACTIVE[t]
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    }`}
                  >
                    {TYPE_LONG[t]}
                  </button>
                );
              })}
              <span className="ml-auto text-[10px] text-slate-400">
                กด Enter เพื่อเพิ่ม
              </span>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onDraftKeyDown}
              placeholder="พิมพ์ที่นี่ แล้วกด Enter เพื่อเพิ่ม"
              className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Sidebar — short Thai labels matched to the three item types plus
            the dropped/promoted lifecycle. The previous "Shortcuts" block
            was removed when keyboard shortcuts stopped being central; the
            remaining keys (Enter / Esc / arrows) are surfaced inline next
            to where they apply. */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              สรุป
            </p>
            <ul className="space-y-1.5 text-xs">
              <SidebarCount label="สิ่งที่อยากได้" value={stats.REQ} dotClass="bg-red-500" />
              <SidebarCount label="ที่ตกลงแล้ว" value={stats.DEC} dotClass="bg-blue-500" />
              <SidebarCount label="คำถามค้าง" value={stats.Q} dotClass="bg-amber-500" />
              <SidebarCount
                label="พักไว้ก่อน"
                value={stats.dropped}
                dotClass="bg-slate-300"
              />
            </ul>
          </div>

          {promotedItems.length > 0 && (
            <div className="mt-3 rounded-lg border border-slate-200 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                ส่งเข้า Board แล้ว
              </p>
              <ul className="space-y-1 text-xs">
                {promotedItems.slice(0, 6).map((it) => (
                  <li key={it.id} className="truncate text-indigo-700">
                    → {it.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
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

function ItemRow({
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
  // Type / drop / select / delete are click-only (see the rationale block at
  // the top of the file).
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
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          const idx = TYPE_CYCLE.indexOf(item.type);
          onChangeType(TYPE_CYCLE[(idx + 1) % TYPE_CYCLE.length]);
        }}
        className={`shrink-0 rounded border px-1.5 py-0 text-[10px] font-bold uppercase ${TYPE_CHIP[item.type]}`}
        disabled={promoted || dropped}
        title={`${TYPE_TOOLTIP[item.type]} · คลิกเพื่อสลับชนิด`}
      >
        {item.type}
      </button>
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

function SidebarCount({
  label,
  value,
  dotClass,
}: {
  label: string;
  value: number;
  dotClass: string;
}) {
  return (
    <li className="flex items-center justify-between text-slate-600">
      <span className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        {label}
      </span>
      <span className="font-semibold text-slate-800">{value}</span>
    </li>
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
