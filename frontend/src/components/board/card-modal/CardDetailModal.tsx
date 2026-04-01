// components/kanban/card-modal/CardDetailModal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Folder, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Card } from "@/types/board";
import { useCardForm } from "../../../hooks/useCardForm";
import { CardFormFields } from "./CardFormFields";

export interface FormState {
  title: string;
  description: string;
  due_date: string;
  assignee_id: string;
  priority: string;
  estimated_hours: string;
}

interface CardDetailModalProps {
  card: Card;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (cardId: string, form: FormState) => void;
  onDelete: (cardId: string) => void;
}

export function CardDetailModal({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdated,
  onDelete,
}: CardDetailModalProps) {
  // 1. นำ Logic ทั้งหมดไปไว้ใน Hook เดียว
  const {
    form,
    members,
    error,
    isDirty,
    assigneeName,
    handleChange,
    validate,
  } = useCardForm(card, boardId, isOpen);

  const [isSaving, setIsSaving] = useState(false);

  // 2. Handlers หลัก
  const handleSave = () => {
    if (!validate()) return;
    setIsSaving(true);
    // สมมติว่า onUpdated มีการจัดการ await หรือไม่ก็เซ็ตกลับตอนจบ
    onUpdated(card.id, form);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = () => onDelete(card.id);

  // 3. ประกอบ UI
  return (
    <Dialog open={isOpen} onClose={onClose} fullWidth maxWidth="sm">
      {/* --- ส่วนหัว (Header) --- */}
      <DialogTitle className="border-b border-slate-100 pb-4 pt-5">
        <div className="flex items-center gap-3 group">
          <div className="text-slate-400 shrink-0">
            <Folder size={24} />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              value={form.title}
              onChange={handleChange("title")}
              placeholder="Enter card title..."
              className="w-full text-2xl font-extrabold text-slate-800 bg-transparent border border-transparent rounded-lg px-3 py-0.5 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-text placeholder:text-slate-300 pr-10"
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
              <Pencil size={18} />
            </div>
          </div>
        </div>
      </DialogTitle>

      {/* --- ส่วนเนื้อหา (Content) --- */}
      <DialogContent className="pt-4">
        <CardFormFields
          form={form}
          members={members}
          assigneeName={assigneeName}
          onChange={handleChange}
          error={error}
        />
      </DialogContent>

      {/* --- ส่วนปุ่มกด (Actions) --- */}
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
          <Trash2 size={16} /> <span>Delete</span>
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
