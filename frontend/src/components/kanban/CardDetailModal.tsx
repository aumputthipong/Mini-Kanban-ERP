// components/kanban/CardDetailModal.tsx
"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Chip,
} from "@mui/material";
import {
  Calendar,
  Clock,
  User,
  Loader2,
  Trash2,
  Folder,
  Edit,
  Pencil,
} from "lucide-react";
import { useState } from "react";
import type { Card } from "@/types/board";
import { API_URL } from "@/lib/constants";

interface CardDetailModalProps {
  card: Card;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (updated: Card) => void;
  onDelete: (cardId: string) => void;
}

const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;

const priorityColor: Record<
  string,
  "success" | "warning" | "error" | "default"
> = {
  low: "success",
  medium: "warning",
  high: "error",
};

interface FormState {
  title: string;
  description: string;
  due_date: string;
  assignee_id: string;
  priority: string;
  estimated_hours: string;
}

export function CardDetailModal({
  card,
  isOpen,
  onClose,
  onUpdated,
  onDelete,
}: CardDetailModalProps) {
  const [form, setForm] = useState<FormState>({
    title: card.title,
    description: card.description ?? "",
    due_date: card.due_date ?? "",
    assignee_id: card.assignee_id ?? "",
    priority: card.priority ?? "",
    estimated_hours:
      card.estimated_hours != null ? String(card.estimated_hours) : "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty =
    form.title !== card.title ||
    form.description !== (card.description ?? "") ||
    form.due_date !== (card.due_date ?? "") ||
    form.assignee_id !== (card.assignee_id ?? "") ||
    form.priority !== (card.priority ?? "") ||
    form.estimated_hours !==
      (card.estimated_hours != null ? String(card.estimated_hours) : "");

  const set =
    (field: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.title.trim()) {
      setError("Title cannot be empty.");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/cards/${card.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          description: form.description || null,
          due_date: form.due_date || null,
          assignee_id: form.assignee_id || null,
          priority: form.priority || null,
          estimated_hours: form.estimated_hours
            ? parseFloat(form.estimated_hours)
            : null,
        }),
      });

      if (!res.ok) throw new Error(`Failed to update card (${res.status})`);

      const updated: Card = await res.json();
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    onDelete(card.id);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="border-b border-slate-100 pb-4 pt-5">
        {/* 1. เปลี่ยน items-start เป็น items-center ตรงนี้ครับ */}
        <div className="flex items-center gap-3 group">
          
          {/* 2. เอา mt-2 ออกไปเลย เพราะ items-center จะจับให้อยู่ตรงกลางอัตโนมัติ */}
          <div className="text-slate-400 shrink-0">
            <Folder size={24} /> {/* ปรับขนาดขึ้นนิดนึงให้สมดุลกับ text-2xl */}
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="Enter card title..."
              className="w-full text-2xl font-extrabold text-slate-800 bg-transparent border border-transparent rounded-lg px-3 py-0.5 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-text placeholder:text-slate-300 pr-10"
            />
            
            {/* ไอคอนดินสอ (อยู่ตรงกลางเหมือนเดิมเพราะใช้ top-1/2 -translate-y-1/2) */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
              <Pencil size={18} />
            </div>
          </div>

        </div>
      </DialogTitle>
      <DialogContent className="pt-4 flex flex-col gap-5 ">
        {/* Description */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-1 pt-2">
            Description
          </label>
          <textarea
            rows={3}
            value={form.description}
            onChange={set("description")}
            placeholder="Add a description..."
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Priority */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1">
              Priority
            </label>
            <select
              value={form.priority}
              onChange={set("priority")}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">None</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
              <Calendar size={11} /> Due Date
            </label>
            <input
              type="date"
              value={form.due_date}
              onChange={set("due_date")}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-600"
            />
          </div>

          {/* Assignee */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
              <User size={11} /> Assignee ID
            </label>
            <input
              type="text"
              value={form.assignee_id}
              onChange={set("assignee_id")}
              placeholder="User UUID"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          {/* Estimated Hours */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
              <Clock size={11} /> Estimated Hours
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.estimated_hours}
              onChange={set("estimated_hours")}
              placeholder="0"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        {/* Current assignee name (read-only) */}
        {card.assignee_name && (
          <p className="text-xs text-slate-400">
            Currently assigned to{" "}
            <span className="font-semibold text-slate-600">
              {card.assignee_name}
            </span>
          </p>
        )}

        {/* Priority badge preview */}
        {form.priority && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Preview:</span>
            <Chip
              label={form.priority.toUpperCase()}
              color={priorityColor[form.priority]}
              size="small"
            />
          </div>
        )}

        {error && <p className="text-sm text-red-500">{error}</p>}
      </DialogContent>

      <DialogActions
        disableSpacing
        sx={{ justifyContent: "space-between", padding: "16px" }}
        className="border-t border-slate-100"
      >
        {/* ฝั่งซ้าย: ปุ่ม Delete */}
        <button
          onClick={handleDelete}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>

        {/* ฝั่งขวา: กลุ่มปุ่ม Cancel & Save */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onClose}
            color="inherit"
            disabled={isSaving}
            sx={{ textTransform: "none", fontWeight: 600, color: "#64748b" }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={isSaving || !isDirty}
            startIcon={
              isSaving ? <Loader2 size={14} className="animate-spin" /> : null
            }
            disableElevation
            sx={{
              textTransform: "none",
              fontWeight: 600,
              bgcolor: "#0f172a",
              "&:hover": { bgcolor: "#334155" },
            }}
          >
            Save changes
          </Button>
        </div>
      </DialogActions>
    </Dialog>
  );
}
