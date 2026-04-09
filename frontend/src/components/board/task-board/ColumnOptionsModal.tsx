"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// ── colour palette ────────────────────────────────────────────────────────────
export const COLUMN_COLOR_PALETTE: { key: string | null; hex: string | null; label: string }[] = [
  { key: null,      hex: null,      label: "Default" },
  { key: "slate",   hex: "#94a3b8", label: "Slate"   },
  { key: "blue",    hex: "#60a5fa", label: "Blue"    },
  { key: "purple",  hex: "#a78bfa", label: "Purple"  },
  { key: "green",   hex: "#34d399", label: "Green"   },
  { key: "amber",   hex: "#fbbf24", label: "Amber"   },
  { key: "rose",    hex: "#fb7185", label: "Rose"    },
  { key: "pink",    hex: "#f472b6", label: "Pink"    },
  { key: "cyan",    hex: "#22d3ee", label: "Cyan"    },
];

export function getColumnColorHex(key?: string | null): string | null {
  return COLUMN_COLOR_PALETTE.find((c) => c.key === (key ?? null))?.hex ?? null;
}

// ── props ─────────────────────────────────────────────────────────────────────
interface ColumnOptionsModalProps {
  open: boolean;
  columnId: string;
  initialTitle: string;
  initialCategory: "TODO" | "DONE";
  initialColor: string | null;
  onSave: (title: string, category: "TODO" | "DONE", color: string | null) => void;
  onDelete: () => void;
  onClose: () => void;
}

// ── component ─────────────────────────────────────────────────────────────────
export function ColumnOptionsModal({
  open,
  initialTitle,
  initialCategory,
  initialColor,
  onSave,
  onDelete,
  onClose,
}: ColumnOptionsModalProps) {
  const [title, setTitle] = useState(initialTitle);
  const [category, setCategory] = useState<"TODO" | "DONE">(initialCategory);
  const [color, setColor] = useState<string | null>(initialColor);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // sync when column changes (e.g. WS update while modal is open)
  useEffect(() => {
    setTitle(initialTitle);
    setCategory(initialCategory);
    setColor(initialColor);
  }, [initialTitle, initialCategory, initialColor, open]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  if (!open) return null;

  const handleSave = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onSave(trimmed, category, color);
    onClose();
  };

  const selectedHex = getColumnColorHex(color);

  return createPortal(
    <>
      {/* backdrop */}
      <div
        className="fixed inset-0 z-[9998] bg-black/30"
        onClick={onClose}
      />

      {/* panel */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-sm mx-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-800">Column options</h2>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          <div className="px-5 py-4 flex flex-col gap-5">
            {/* ── name ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Name
              </label>
              <input
                autoFocus
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
              />
            </div>

            {/* ── category ── */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Category
              </label>
              <div className="flex gap-2">
                {(["TODO", "DONE"] as const).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                      category === cat
                        ? cat === "DONE"
                          ? "bg-emerald-500 text-white border-emerald-500"
                          : "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* ── color ── */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Color
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLUMN_COLOR_PALETTE.map(({ key, hex, label }) => (
                  <button
                    key={String(key)}
                    title={label}
                    onClick={() => setColor(key)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 ${
                      color === key
                        ? "border-slate-700 scale-110"
                        : "border-transparent"
                    }`}
                    style={{
                      backgroundColor: hex ?? "#e2e8f0",
                      outline: color === key ? "2px solid #1e293b" : "none",
                      outlineOffset: "2px",
                    }}
                  />
                ))}
              </div>
              {selectedHex && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span
                    className="w-3 h-3 rounded-full inline-block"
                    style={{ backgroundColor: selectedHex }}
                  />
                  Selected: {COLUMN_COLOR_PALETTE.find((c) => c.key === color)?.label}
                </div>
              )}
            </div>
          </div>

          {/* footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100">
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="flex items-center gap-1.5 text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors"
            >
              <Trash2 size={14} /> Delete column
            </button>

            <div className="flex gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!title.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-slate-900 text-white font-medium hover:bg-slate-700 disabled:opacity-40 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="Delete column?"
        description="All cards in this column will be permanently deleted."
        confirmLabel="Delete"
        destructive
        onConfirm={() => { setConfirmDeleteOpen(false); onClose(); onDelete(); }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>,
    document.body
  );
}
