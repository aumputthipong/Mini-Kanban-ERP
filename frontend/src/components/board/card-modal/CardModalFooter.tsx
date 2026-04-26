"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface CardModalFooterProps {
  canEdit: boolean;
  isDirty: boolean;
  isSaving: boolean;
  cardTitle: string;
  onSave: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export function CardModalFooter({
  canEdit,
  isDirty,
  isSaving,
  cardTitle,
  onSave,
  onDelete,
  onClose,
}: CardModalFooterProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 shrink-0">
        {canEdit ? (
          <button
            onClick={() => setConfirmOpen(true)}
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
              onClick={onSave}
              disabled={isSaving || !isDirty}
              className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {isSaving && <Loader2 size={14} className="animate-spin" />}
              Save changes
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete task"
        description={`"${cardTitle}" will be permanently deleted. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          setConfirmOpen(false);
          onDelete();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
