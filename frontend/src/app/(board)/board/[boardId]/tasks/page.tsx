"use client";

import { use, useState, useRef } from "react";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { useBoardActions } from "@/hooks/useBoardActions";
import { useBoardStore } from "@/store/useBoardStore";
import { Plus } from "lucide-react";
import { MemberFilterBar } from "@/components/board/task-board/MemberFilterBar";

interface PageProps {
  params: Promise<{ boardId: string }>;
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
        onClick={() => {
          setEditing(true);
          setTimeout(() => inputRef.current?.focus(), 0);
        }}
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
          if (e.key === "Escape") {
            setValue("");
            setEditing(false);
          }
        }}
        placeholder="Column name..."
        className="text-sm border border-blue-400 rounded-lg px-3 py-1.5 outline-none ring-2 ring-blue-100 w-40"
      />
      <button
        onClick={submit}
        className="text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-1.5 font-medium transition-colors"
      >
        Add
      </button>
      <button
        onClick={() => {
          setValue("");
          setEditing(false);
        }}
        className="text-xs border border-slate-200 hover:bg-slate-50 rounded-lg px-3 py-1.5 text-slate-600 transition-colors"
      >
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
