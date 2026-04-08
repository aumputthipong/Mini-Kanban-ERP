"use client";

import { use, useState, useRef } from "react";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { useBoardActions } from "@/hooks/useBoardActions";
import { useBoardStore } from "@/store/useBoardStore";
import { Plus } from "lucide-react";

interface PageProps {
  params: Promise<{ boardId: string }>;
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
];

function avatarColor(userId: string) {
  const idx = userId.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function MemberFilterBar() {
  const { boardMembers, currentUserId, filterAssigneeId, setFilterAssigneeId } =
    useBoardStore();

  const toggle = (userId: string) => {
    setFilterAssigneeId(filterAssigneeId === userId ? null : userId);
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setFilterAssigneeId(null)}
        className={`px-3 h-7 text-xs font-medium rounded-full border transition-colors ${
          filterAssigneeId === null
            ? "bg-slate-800 text-white border-slate-800"
            : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
        }`}
      >
        All
      </button>

      {boardMembers.map((member) => {
        const isActive = filterAssigneeId === member.user_id;
        const isMe = member.user_id === currentUserId;
        const initial = member.full_name?.charAt(0).toUpperCase() ?? "?";
        const color = avatarColor(member.user_id);

        return (
          <button
            key={member.user_id}
            onClick={() => toggle(member.user_id)}
            title={member.full_name + (isMe ? " (Me)" : "")}
            className={`relative flex items-center justify-center w-7 h-7 rounded-full text-white text-[11px] font-bold transition-all ${color} ${
              isActive
                ? "ring-2 ring-offset-1 ring-blue-500 scale-110"
                : "opacity-80 hover:opacity-100 hover:scale-105"
            }`}
          >
            {initial}
            {isMe && (
              <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400 font-normal whitespace-nowrap">
                Me
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

function AddColumnButton({ onAdd }: { onAdd: (title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (value.trim()) onAdd(value.trim());
    setValue("");
    setEditing(false);
  };

  if (!editing) {
    return (
      <button
        onClick={() => { setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); }}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors shadow-sm"
      >
        <Plus size={14} /> Add column
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") submit();
          if (e.key === "Escape") { setValue(""); setEditing(false); }
        }}
        placeholder="Column name..."
        className="text-sm border border-blue-400 rounded-lg px-3 py-1.5 outline-none ring-2 ring-blue-100 w-40"
      />
      <button onClick={submit} className="text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-1.5 font-medium transition-colors">
        Add
      </button>
      <button onClick={() => { setValue(""); setEditing(false); }} className="text-xs border border-slate-200 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-slate-600 transition-colors">
        Cancel
      </button>
    </div>
  );
}

function BoardToolbar({ boardId }: { boardId: string }) {
  const { handleAddColumn } = useBoardActions(boardId);

  return (
    <div className="-mx-8 flex items-center gap-3 px-8 h-14 bg-slate-50 border-b border-slate-200 mb-6">
      <MemberFilterBar />
      <div className="w-px h-5 bg-slate-300 mx-1" />
      <AddColumnButton onAdd={handleAddColumn} />
    </div>
  );
}

export default function KanbanPage({ params }: PageProps) {
  const { boardId } = use(params);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 h-full flex flex-col min-h-0">
      <BoardToolbar boardId={boardId} />
      <div className="flex-1 min-h-0 overflow-hidden">
        <KanbanBoard boardId={boardId} />
      </div>
    </div>
  );
}
