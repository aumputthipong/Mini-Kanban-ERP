// components/kanban/CardDetailModal.tsx
"use client";

import {
  Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Chip,
} from "@mui/material";
import { Calendar, Clock, User, Loader2, Trash2, Folder, Pencil } from "lucide-react";
import { useEffect, useState } from "react";
import type { Card, BoardMember } from "@/types/board";
import { API_URL } from "@/lib/constants";

export interface FormState {
  title:           string;
  description:     string;
  due_date:        string;
  assignee_id:     string;
  priority:        string;
  estimated_hours: string;
}

interface CardDetailModalProps {
  card:      Card;
  boardId:   string;       // เพิ่ม
  isOpen:    boolean;
  onClose:   () => void;
  onUpdated: (cardId: string, form: FormState) => void;
  onDelete:  (cardId: string) => void;
}

const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;

const priorityColor: Record<string, "success" | "warning" | "error" | "default"> = {
  low:    "success",
  medium: "warning",
  high:   "error",
};

export function CardDetailModal({
  card, boardId, isOpen, onClose, onUpdated, onDelete,
}: CardDetailModalProps) {
  const [form, setForm] = useState<FormState>({
    title:           card.title,
    description:     card.description ?? "",
    due_date:        card.due_date ?? "",
    assignee_id:     card.assignee_id ?? "",
    priority:        card.priority ?? "",
    estimated_hours: card.estimated_hours != null ? String(card.estimated_hours) : "",
  });
  const [members, setMembers] = useState<BoardMember[]>([]);  // เปลี่ยนจาก users
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // sync form เมื่อ card เปลี่ยน
  useEffect(() => {
    setForm({
      title:           card.title,
      description:     card.description ?? "",
      due_date:        card.due_date ?? "",
      assignee_id:     card.assignee_id ?? "",
      priority:        card.priority ?? "",
      estimated_hours: card.estimated_hours != null ? String(card.estimated_hours) : "",
    });
    setError(null);
  }, [card]);

  // fetch members 
  useEffect(() => {
    if (!isOpen || !boardId) return;
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_URL}/boards/${boardId}/members`, {
          credentials: "include",
        });
        if (!res.ok) return;
        setMembers(await res.json());
      } catch {}
    };
    fetchMembers();
  }, [isOpen, boardId]);

  const isDirty =
    form.title           !== card.title ||
    form.description     !== (card.description ?? "") ||
    form.due_date        !== (card.due_date ?? "") ||
    form.assignee_id     !== (card.assignee_id ?? "") ||
    form.priority        !== (card.priority ?? "") ||
    form.estimated_hours !== (card.estimated_hours != null ? String(card.estimated_hours) : "");

  const set =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSave = () => {
    if (!form.title.trim()) {
      setError("Title cannot be empty.");
      return;
    }
    onUpdated(card.id, form);
    onClose();
  };

  const handleDelete = () => onDelete(card.id);

  // หา assignee name จาก members
  const assigneeName = members.find((m) => m.user_id === form.assignee_id)?.full_name;

  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle className="border-b border-slate-100 pb-4 pt-5">
        <div className="flex items-center gap-3 group">
          <div className="text-slate-400 shrink-0">
            <Folder size={24} />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={form.title}
              onChange={set("title")}
              placeholder="Enter card title..."
              className="w-full text-2xl font-extrabold text-slate-800 bg-transparent border border-transparent rounded-lg px-3 py-0.5 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-text placeholder:text-slate-300 pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
              <Pencil size={18} />
            </div>
          </div>
        </div>
      </DialogTitle>

      <DialogContent className="pt-4 flex flex-col gap-5">
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

          {/* Assignee — เปลี่ยนจาก input เป็น dropdown */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
              <User size={11} /> Assignee
            </label>
            <select
              value={form.assignee_id}
              onChange={set("assignee_id")}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Unassigned</option>
              {members.map((m) => (
                <option key={m.user_id} value={m.user_id}>
                  {m.full_name} ({m.email})
                </option>
              ))}
            </select>
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

        {/* Assignee preview */}
        {assigneeName && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
              {assigneeName.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-slate-500">
              Assigned to{" "}
              <span className="font-semibold text-slate-700">{assigneeName}</span>
            </span>
          </div>
        )}

        {/* Priority preview */}
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
        <button
          onClick={handleDelete}
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          <Trash2 size={16} />
          <span>Delete</span>
        </button>

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
            startIcon={isSaving ? <Loader2 size={14} className="animate-spin" /> : null}
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