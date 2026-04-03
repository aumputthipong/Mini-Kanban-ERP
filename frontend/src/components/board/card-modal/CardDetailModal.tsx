// components/kanban/card-modal/CardDetailModal.tsx
"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import {
  Folder,
  Pencil,
  Trash2,
  Loader2,
  CheckSquare,
  Plus,
} from "lucide-react";
import type { Card } from "@/types/board";
import { useCardForm } from "../../../hooks/useCardForm";
import { CardFormFields } from "./CardFormFields";
import { useBoardActions } from "@/hooks/useBoardActions";
import { SubtaskItem } from "../subtask/SubtaskItem";

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
  // เพิ่ม Prop สำหรับรับฟังก์ชัน Add Subtask
  onAddSubtask?: (cardId: string, title: string) => void;
}

export function CardDetailModal({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdated,
  onDelete,
  onAddSubtask,
}: CardDetailModalProps) {
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
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");



  const {
    fetchSubtasks,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleUpdateSubtaskTitle,
  } = useBoardActions(boardId);
  const [isLoadingSubtasks, setIsLoadingSubtasks] = useState(false);

  // ✅ 2. useEffect ทำงานดึงข้อมูลตามปกติ
  useEffect(() => {
    if (isOpen && card?.id) {
      const loadData = async () => {
        setIsLoadingSubtasks(true);
        await fetchSubtasks(card.id);
        setIsLoadingSubtasks(false);
      };
      loadData();
    }
  }, [isOpen, card?.id]);

  const handleSave = () => {
    if (!validate()) return;
    setIsSaving(true);
    onUpdated(card.id, form);
    setIsSaving(false);
    onClose();
  };

  const handleDelete = () => onDelete(card.id);

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !onAddSubtask) return;

    onAddSubtask(card.id, newSubtaskTitle.trim());
    setNewSubtaskTitle("");
  };

  const totalSubtasks = card.subtasks?.length || 0;
  const completedSubtasks =
    card.subtasks?.filter((st) => st.is_done).length || 0;
  const progressPercent =
    totalSubtasks === 0
      ? 0
      : Math.round((completedSubtasks / totalSubtasks) * 100);

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
      <DialogContent className="pt-4 pb-6">
        <CardFormFields
          form={form}
          members={members}
          assigneeName={assigneeName}
          onChange={handleChange}
          error={error}
        />

        {/* --- ส่วน Subtasks --- */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <CheckSquare size={18} className="text-blue-500" />
              Subtasks
            </h3>

            {totalSubtasks > 0 && (
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">
                {progressPercent}%
              </span>
            )}
          </div>

          {/* Progress Bar (แสดงเมื่อมี Subtask) */}
          {totalSubtasks > 0 && (
            <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}

          {/* รายการ Subtask */}
      <div className="flex flex-col gap-2 mb-4">
            {card.subtasks?.map((st) => (
              // 3. เรียกใช้งาน Component ใหม่ และโยน Props ให้มัน
              <SubtaskItem
                key={st.id}
                cardId={card.id}
                subtask={st}
                onToggle={handleToggleSubtask}
                onUpdateTitle={handleUpdateSubtaskTitle}
                onDelete={handleDeleteSubtask}
              />
            ))}
          </div>

          {/* ฟอร์มเพิ่ม Subtask */}
          <form
            onSubmit={handleAddSubtaskSubmit}
            className="flex items-center gap-2 px-2"
          >
            <div className="flex-1 relative">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a new subtask..."
                className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!newSubtaskTitle.trim()}
              className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Plus size={18} />
            </button>
          </form>
        </div>
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
