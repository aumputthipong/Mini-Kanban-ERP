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
import { ChevronLeft, Download, ArrowRight, Trash2 } from "lucide-react";
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

const TYPE_LABEL: Record<PlanningItemType, string> = {
  REQ: "REQ",
  DEC: "DEC",
  Q: "Q",
};

const TYPE_CHIP: Record<PlanningItemType, string> = {
  REQ: "bg-red-50 text-red-700 border-red-200",
  DEC: "bg-blue-50 text-blue-700 border-blue-200",
  Q: "bg-amber-50 text-amber-700 border-amber-200",
};

const TYPE_CYCLE: PlanningItemType[] = ["REQ", "DEC", "Q"];

// The capture surface. Single text input at the bottom (Enter commits as new
// item), arrow keys navigate the existing list, ⌘1-3 change current item's
// type, ⌘D drops/undrops, ⌘S selects/deselects, ⌘↵ promotes all selected.
//
// Local state is the source of truth for what the user sees; every mutation
// fires the corresponding API call in the background. We don't wait for the
// server response — meeting velocity matters more than confirming success
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
        showToast({ message: "Couldn't load session", duration: 4000 });
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
          showToast({ message: "Couldn't save change", duration: 4000 });
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
      showToast({ message: "Couldn't add item", duration: 4000 });
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
        showToast({ message: "Couldn't delete item", duration: 4000 });
      }
    },
    [showToast],
  );

  const promoteSelected = useCallback(async () => {
    const targets = items.filter((it) => it.status === "selected");
    if (targets.length === 0) {
      showToast({ message: "ยังไม่มี item ที่ select ไว้ (⌘S)", duration: 3000 });
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
        showToast({ message: `Couldn't promote: ${it.title}`, duration: 4000 });
      }
    }
    showToast({
      message: `Promoted ${targets.length} → Board`,
      duration: 3000,
    });
  }, [items, showToast]);

  // Keyboard ------------------------------------------------------

  // Existing-item keys handled inside each row (focus-driven). The capture
  // input uses its own handler so Enter / ⌘↵ behave as expected.
  const onDraftKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && (e.key === "1" || e.key === "2" || e.key === "3")) {
      e.preventDefault();
      const idx = parseInt(e.key, 10) - 1;
      setNewType(TYPE_CYCLE[idx]);
      return;
    }
    if (meta && e.key === "Enter") {
      e.preventDefault();
      promoteSelected();
      return;
    }
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
            <Download size={14} /> Export
          </button>
          <button
            type="button"
            onClick={promoteSelected}
            disabled={stats.selected === 0}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            <ArrowRight size={14} />
            Promote {stats.selected > 0 ? `${stats.selected} → Tasks` : "selected"}
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
            {detail.label && <>Label: {detail.label} · </>}
            {savedAt && <>auto-saved {formatRelativeFromNow(savedAt)}</>}
          </p>

          <div className="mt-4 flex flex-col gap-1">
            {items.length === 0 && (
              <p className="rounded border border-dashed border-slate-300 bg-slate-50/40 p-6 text-center text-sm text-slate-400">
                ยังไม่มี item · พิมพ์ที่ช่องด้านล่างแล้วกด Enter
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

          {/* Capture row */}
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-50">
            <button
              type="button"
              onClick={() => {
                const idx = TYPE_CYCLE.indexOf(newType);
                setNewType(TYPE_CYCLE[(idx + 1) % TYPE_CYCLE.length]);
              }}
              className={`shrink-0 rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TYPE_CHIP[newType]}`}
              title="คลิกเปลี่ยนชนิด หรือใช้ ⌘1/⌘2/⌘3"
            >
              {TYPE_LABEL[newType]}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={onDraftKeyDown}
              placeholder="พิมพ์ item ใหม่... (Enter เพื่อ commit)"
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-full shrink-0 lg:w-64">
          <div className="rounded-lg border border-slate-200 p-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              In this session
            </p>
            <ul className="space-y-1.5 text-xs">
              <SidebarCount label="REQ" value={stats.REQ} dotClass="bg-red-500" />
              <SidebarCount label="DEC" value={stats.DEC} dotClass="bg-blue-500" />
              <SidebarCount label="Q open" value={stats.Q} dotClass="bg-amber-500" />
              <SidebarCount
                label="Dropped"
                value={stats.dropped}
                dotClass="bg-slate-300"
              />
            </ul>
          </div>

          {promotedItems.length > 0 && (
            <div className="mt-3 rounded-lg border border-slate-200 p-4">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Promoted → Board
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

          <div className="mt-3 rounded-lg border border-slate-200 p-4">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Shortcuts
            </p>
            <ul className="space-y-1 text-xs text-slate-600">
              <ShortcutRow keys="⌘1 / ⌘2 / ⌘3" label="REQ / DEC / Q" />
              <ShortcutRow keys="⌘D" label="Drop / undrop" />
              <ShortcutRow keys="⌘S" label="Select / deselect" />
              <ShortcutRow keys="⌘↵" label="Promote selected" />
              <ShortcutRow keys="↑ / ↓" label="Navigate items" />
            </ul>
          </div>
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
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setDraft(item.title);
  }, [item.title]);

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

  // KeyboardEvent<HTMLElement> covers both branches — the input while
  // editing, and the button when displaying. They share the same shortcut
  // set so a single handler keeps the keymap in one place.
  const onKey = (e: KeyboardEvent<HTMLElement>) => {
    const meta = e.metaKey || e.ctrlKey;
    if (meta && (e.key === "1" || e.key === "2" || e.key === "3")) {
      e.preventDefault();
      onChangeType(TYPE_CYCLE[parseInt(e.key, 10) - 1]);
      return;
    }
    if (meta && e.key.toLowerCase() === "d") {
      e.preventDefault();
      onToggleStatus("dropped");
      return;
    }
    if (meta && e.key.toLowerCase() === "s") {
      e.preventDefault();
      onToggleStatus("selected");
      return;
    }
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
          Selected
        </span>
      )}
      {promoted && item.promoted_to_card_id && (
        <span className="shrink-0 text-[10px] text-indigo-600">→ promoted</span>
      )}
      <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus("selected");
          }}
          disabled={promoted || dropped}
          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-30"
        >
          {selected ? "Unsel" : "Sel"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleStatus("dropped");
          }}
          disabled={promoted}
          className="rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200 hover:text-slate-800 disabled:opacity-30"
        >
          {dropped ? "Undrop" : "Drop"}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
          aria-label="Delete"
        >
          <Trash2 size={12} />
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

function ShortcutRow({ keys, label }: { keys: string; label: string }) {
  return (
    <li className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <kbd className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-700">
        {keys}
      </kbd>
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
