"use client";

import {
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { FileText, ListChecks, MessageSquare } from "lucide-react";
import { useBoardStore } from "@/store/useBoardStore";
import { useCanManageBoard } from "@/hooks/useBoardRole";
import type {
  PlanningItem,
  PlanningItemStatus,
  PlanningItemType,
} from "@/types/planning";
import { CommentThread } from "./CommentThread";
import { ItemActionButtons } from "./ItemActionButtons";
import { ItemClaimAffordance } from "./ItemClaimAffordance";
import { ItemDetailsPanel, countNonEmptyLines } from "./ItemDetailsPanel";
import { ItemTypePopover } from "./ItemTypePopover";
import { usePlanningComments } from "@/hooks/usePlanningComments";

interface ItemRowProps {
  index: number;
  item: PlanningItem;
  focused: boolean;
  onFocus: () => void;
  onChangeType: (t: PlanningItemType) => void;
  onChangeTitle: (t: string) => void;
  onToggleStatus: (s: PlanningItemStatus) => void;
  onDelete: () => void;
  onChangeAcceptanceCriteria: (value: string) => void;
  onChangeImplementationNote: (value: string) => void;
  onClaim: () => void;
  onRelease: () => void;
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
  onChangeAcceptanceCriteria,
  onChangeImplementationNote,
  onClaim,
  onRelease,
  onUp,
  onDown,
}: ItemRowProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);
  const currentUserId = useBoardStore((s) => s.currentUserId);
  const boardMembers = useBoardStore((s) => s.boardMembers);
  const canManage = useCanManageBoard();
  // Lazy comment thread — the hook never fetches until `load()` is called,
  // which happens the first time the user clicks the comment badge. Each
  // row owns its own hook instance so the threads don't interleave.
  const comments = usePlanningComments(item.id, currentUserId || null);

  const claimedByUserId = item.claimed_by_user_id ?? null;
  const isClaimedByMe =
    !!currentUserId && claimedByUserId === currentUserId;
  const claimerName =
    claimedByUserId
      ? boardMembers.find((m) => m.user_id === claimedByUserId)?.full_name ||
        "ผู้ใช้คนอื่น"
      : "";
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
  const acCount = countNonEmptyLines(item.acceptance_criteria);
  const hasNote = (item.implementation_note ?? "").trim().length > 0;
  const hasDetails = acCount > 0 || hasNote;

  return (
    <div id={`item-${item.id}`} className="flex flex-col">
    <div
      onClick={onFocus}
      className={`group flex items-center gap-2 rounded px-2 py-1 ${
        focused ? "bg-indigo-50" : "hover:bg-slate-50"
      }`}
    >
      <span className="w-6 shrink-0 text-right text-[10px] text-slate-300">
        {String(index + 1).padStart(2, "0")}
      </span>
      <ItemTypePopover type={item.type} disabled={promoted} onChange={onChangeType} />
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
      {/* Indicator badges — visible at full opacity so a glance reveals
          which rows have detail attached without having to expand them. */}
      {!expanded && acCount > 0 && (
        <span
          className="inline-flex shrink-0 items-center gap-0.5 rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700"
          title={`Acceptance criteria · ${acCount} ข้อ`}
        >
          <ListChecks size={10} /> AC: {acCount} ข้อ
        </span>
      )}
      {!expanded && hasNote && (
        <span
          className="inline-flex shrink-0 items-center gap-0.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600"
          title="มี implementation note"
        >
          <FileText size={10} /> มี note
        </span>
      )}
      {!promoted && (
        <ItemClaimAffordance
          claimedByUserId={claimedByUserId}
          isClaimedByMe={isClaimedByMe}
          claimerName={claimerName}
          claimedAt={item.claimed_at ?? null}
          canForceRelease={canManage && !isClaimedByMe}
          onClaim={onClaim}
          onRelease={onRelease}
        />
      )}
      {/* Comment count badge — click toggles the thread expansion. The
          count comes from the hook's local list (includes optimistic
          additions, excludes soft-deleted) so it stays in sync with what
          the thread actually shows. Initial value is "—" until first
          load; clicking triggers the fetch so an unopened row never
          burns a request. */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (!commentsExpanded && !comments.loaded) void comments.load();
          setCommentsExpanded((v) => !v);
        }}
        title={commentsExpanded ? "ซ่อนความคิดเห็น" : "ดูความคิดเห็น"}
        aria-label="ความคิดเห็น"
        aria-expanded={commentsExpanded}
        className={`inline-flex shrink-0 items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-semibold transition-colors ${
          commentsExpanded
            ? "bg-indigo-50 text-indigo-700"
            : "text-slate-500 hover:bg-slate-100"
        }`}
      >
        <MessageSquare size={10} />
        {/* "—" placeholder until first load so the user sees "count
            unknown yet" instead of mistaking blank for zero. */}
        {comments.loaded
          ? comments.comments.filter((c) => !c.deleted_at).length
          : "—"}
      </button>
      <ItemActionButtons
        selected={selected}
        dropped={dropped}
        promoted={promoted}
        expanded={expanded}
        hasDetails={hasDetails}
        onToggleSelected={() => onToggleStatus("selected")}
        onToggleDropped={() => onToggleStatus("dropped")}
        onDelete={onDelete}
        onToggleExpanded={() => setExpanded((v) => !v)}
      />
    </div>
    {expanded && (
      <ItemDetailsPanel
        itemType={item.type}
        acceptanceCriteria={item.acceptance_criteria}
        implementationNote={item.implementation_note}
        onChangeAcceptanceCriteria={onChangeAcceptanceCriteria}
        onChangeImplementationNote={onChangeImplementationNote}
      />
    )}
    {commentsExpanded && (
      <CommentThread
        comments={comments.comments}
        isLoading={comments.isLoading}
        loaded={comments.loaded}
        currentUserId={currentUserId || null}
        onCreate={comments.create}
        onEdit={comments.edit}
        onDelete={comments.remove}
      />
    )}
    </div>
  );
}
