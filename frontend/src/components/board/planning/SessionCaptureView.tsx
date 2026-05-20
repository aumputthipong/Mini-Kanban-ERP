"use client";

import {
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
import { CaptureInput } from "./CaptureInput";
import { ExportDialog } from "./ExportDialog";
import { ItemRow } from "./ItemRow";
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

          <CaptureInput
            inputRef={inputRef}
            draft={draft}
            onDraftChange={setDraft}
            newType={newType}
            onTypeChange={setNewType}
            onCommit={commitNew}
            onJumpToList={() => {
              if (items.length > 0) setFocusIndex(items.length - 1);
            }}
          />
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
