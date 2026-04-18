// components/kanban/card-modal/CardDetailModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  Folder,
  Pencil,
  Trash2,
  Loader2,
  CheckSquare,
  Plus,
  X,
} from "lucide-react";
import type { Card, Tag } from "@/types/board";
import { useCardForm } from "../../../hooks/useCardForm";
import { CardFormFields } from "./CardFormFields";
import { useBoardActions } from "@/hooks/useBoardActions";
import { SubtaskItem } from "../task-board/subtask/SubtaskItem";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusDropdown } from "./StatusDropdown";
import { useBoardStore } from "@/store/useBoardStore";

export interface FormState {
  title: string;
  description: string;
  due_date: string;
  assignee_id: string;
  priority: string;
  estimated_hours: string;
  tags: Tag[];
}

interface CardDetailModalProps {
  card: Card;
  boardId: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: (cardId: string, form: FormState) => void;
  onDelete: (cardId: string) => void;
  onAddSubtask?: (cardId: string, title: string) => void;
  canEdit: boolean;
}

export function CardDetailModal({
  card,
  boardId,
  isOpen,
  onClose,
  onUpdated,
  onDelete,
  onAddSubtask,
  canEdit,
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
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const {
    fetchSubtasks,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleUpdateSubtaskTitle,
    handleChangeColumn,
  } = useBoardActions(boardId);

  const columns = useBoardStore((s) => s.columns);

  // sync subtasks when modal opens
  useEffect(() => {
    if (isOpen && card?.id) {
      fetchSubtasks(card.id);
    }
  }, [isOpen, card?.id]);

  // Escape to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]);

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
  const completedSubtasks = card.subtasks?.filter((st) => st.is_done).length || 0;
  const progressPercent =
    totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-9998 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none px-4 py-6">
        <div
          className="pointer-events-auto w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-slate-100 group shrink-0">
            <div className="text-slate-400 shrink-0">
              <Folder size={20} />
            </div>
            <div className="flex-1 relative min-w-0">
              {canEdit ? (
                <>
                  <input
                    type="text"
                    value={form.title}
                    onChange={handleChange("title")}
                    placeholder="Enter card title..."
                    className="w-full text-xl font-extrabold text-slate-800 bg-transparent border border-transparent rounded-lg px-3 py-0.5 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-text placeholder:text-slate-300 pr-10"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200">
                    <Pencil size={16} />
                  </div>
                </>
              ) : (
                <p className="text-xl font-extrabold text-slate-800 px-3 py-0.5">
                  {form.title}
                </p>
              )}
            </div>
            <StatusDropdown
              columns={columns}
              currentColumnId={card.column_id}
              onChange={(newColId) => handleChangeColumn(card.id, newColId)}
              disabled={!canEdit}
            />
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body — 2 columns */}
          <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
            {/* Left: Description + Subtasks */}
            <div className="flex-1 min-w-0 px-6 py-5 flex flex-col gap-6 overflow-y-auto border-r border-slate-100">
              {/* Description */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Description
                </label>
                {canEdit ? (
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={handleChange("description")}
                    placeholder="Add a description..."
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                  />
                ) : (
                  <p className="text-sm text-slate-600 px-1 min-h-15 whitespace-pre-wrap">
                    {form.description || (
                      <span className="text-slate-300 italic">No description</span>
                    )}
                  </p>
                )}
              </div>

              {/* Subtasks */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={12} className="text-blue-500" />
                    Subtasks
                  </h3>
                  {totalSubtasks > 0 && (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {progressPercent}%
                    </span>
                  )}
                </div>

                {totalSubtasks > 0 && (
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mb-3 overflow-hidden">
                    <div
                      className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2 mb-3">
                  {card.subtasks?.map((st) => (
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

                {canEdit && (
                  <form
                    onSubmit={handleAddSubtaskSubmit}
                    className="flex items-center gap-2"
                  >
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="Add a new subtask..."
                        className="w-full text-sm bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:bg-white focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!newSubtaskTitle.trim()}
                      className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Right: Metadata sidebar */}
            <div className="w-56 shrink-0 px-5 py-5 bg-slate-50/50 overflow-y-auto">
              <CardFormFields
                form={form}
                members={members}
                assigneeName={assigneeName}
                boardId={boardId}
                onChange={handleChange}
                onTagsChange={(tags) => handleChange("tags")({ target: { value: tags } } as never)}
                error={error}
                canEdit={canEdit}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
            {canEdit ? (
              <button
                onClick={() => setDeleteConfirmOpen(true)}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-40 transition-all"
              >
                <Trash2 size={16} />
                Delete
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-40 font-medium"
              >
                {canEdit ? "Cancel" : "Close"}
              </button>
              {canEdit && (
                <button
                  onClick={handleSave}
                  disabled={isSaving || !isDirty}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isSaving && <Loader2 size={14} className="animate-spin" />}
                  Save changes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete task"
        description={`"${card.title}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setDeleteConfirmOpen(false);
          handleDelete();
        }}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </>,
    document.body,
  );
}
