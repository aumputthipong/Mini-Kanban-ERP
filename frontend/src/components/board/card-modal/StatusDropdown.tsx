"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";
import { getColumnColorHex } from "../task-board/ColumnOptionsModal";
import type { Column } from "@/types/board";

interface StatusDropdownProps {
  columns: Column[];
  currentColumnId: string;
  onChange: (newColumnId: string) => void;
  disabled?: boolean;
}

export function StatusDropdown({
  columns,
  currentColumnId,
  onChange,
  disabled,
}: StatusDropdownProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const current = columns.find((c) => c.id === currentColumnId);
  const todoCols = columns.filter((c) => c.category !== "DONE");
  const doneCols = columns.filter((c) => c.category === "DONE");

  useEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setMenuStyle({
      position: "fixed",
      top: r.bottom + 4,
      left: r.left,
      minWidth: Math.max(r.width, 180),
      zIndex: 99999,
    });
  }, [open]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current?.contains(e.target as Node) ||
        btnRef.current?.contains(e.target as Node)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const currentHex = getColumnColorHex(current?.color);
  const pillBg = currentHex ? `${currentHex}22` : "#f1f5f9";
  const pillBorder = currentHex ?? "#cbd5e1";
  const pillColor = currentHex ?? "#475569";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors disabled:opacity-60 disabled:cursor-not-allowed hover:brightness-95 cursor-pointer"
        style={{ backgroundColor: pillBg, borderColor: pillBorder, color: pillColor }}
      >
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: currentHex ?? "#94a3b8" }}
        />
        <span className="truncate max-w-32">{current?.title ?? "—"}</span>
        {!disabled && <ChevronDown size={12} />}
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            style={menuStyle}
            className="bg-white border border-slate-200 rounded-lg shadow-xl overflow-hidden py-1"
          >
            {todoCols.length > 0 && (
              <>
                <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  To do
                </div>
                {todoCols.map((col) => (
                  <StatusOption
                    key={col.id}
                    col={col}
                    current={currentColumnId}
                    onSelect={(id) => {
                      onChange(id);
                      setOpen(false);
                    }}
                  />
                ))}
              </>
            )}
            {doneCols.length > 0 && (
              <>
                <div className="px-3 py-1 mt-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-t border-slate-100">
                  Done
                </div>
                {doneCols.map((col) => (
                  <StatusOption
                    key={col.id}
                    col={col}
                    current={currentColumnId}
                    onSelect={(id) => {
                      onChange(id);
                      setOpen(false);
                    }}
                  />
                ))}
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

function StatusOption({
  col,
  current,
  onSelect,
}: {
  col: Column;
  current: string;
  onSelect: (id: string) => void;
}) {
  const hex = getColumnColorHex(col.color);
  const active = col.id === current;
  return (
    <button
      type="button"
      onClick={() => onSelect(col.id)}
      className={`w-full text-left px-3 py-1.5 text-xs flex items-center gap-2 transition-colors cursor-pointer ${
        active ? "bg-blue-50 font-semibold text-blue-700" : "hover:bg-slate-50 text-slate-700"
      }`}
    >
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: hex ?? "#94a3b8" }}
      />
      <span className="truncate">{col.title}</span>
    </button>
  );
}
