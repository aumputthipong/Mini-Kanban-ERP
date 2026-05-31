// components/kanban/card-modal/CardDetailModal.tsx
"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Card, Tag } from "@/types/board";
import { useCardForm } from "../../../hooks/useCardForm";
import { useEscapeKey } from "@/hooks/useEscapeKey";
import { useBoardActions } from "@/hooks/useBoardActions";
import { CardDevFields } from "./CardDevFields";
import { CardFormFields } from "./CardFormFields";
import { CardModalHeader } from "./CardModalHeader";
import { CardDescriptionField } from "./CardDescriptionField";
import { CardSourceSection } from "./CardSourceSection";
import { CardSubtaskSection } from "./CardSubtaskSection";
import { CardModalFooter } from "./CardModalFooter";

export interface FormState {
  title: string;
  description: string;
  due_date: string;
  assignee_id: string;
  priority: string;
  estimated_hours: string;
  tags: Tag[];
  acceptance_criteria: string;
  implementation_note: string;
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
    setTags,
    validate,
  } = useCardForm(card, boardId, isOpen);

  const [isSaving, setIsSaving] = useState(false);
  const { fetchSubtasks } = useBoardActions(boardId);

  useEffect(() => {
    if (isOpen && card?.id) fetchSubtasks(card.id);
  }, [isOpen, card?.id]);

  useEscapeKey(isOpen, onClose);

  const handleSave = () => {
    if (!validate()) return;
    setIsSaving(true);
    onUpdated(card.id, form);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <>
      {/* Solid scrim (no backdrop-blur): blurring the whole board behind the
          modal is a per-frame GPU composite cost that makes interaction feel
          janky even when JS/INP is fast. A plain scrim separates layers for free. */}
      <div
        className="fixed inset-0 z-9998 bg-slate-900/45"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-9999 flex items-center justify-center pointer-events-none px-4 py-6">
        <div
          className="pointer-events-auto w-full max-w-3xl bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-full"
          onClick={(e) => e.stopPropagation()}
        >
          <CardModalHeader
            cardId={card.id}
            columnId={card.column_id}
            boardId={boardId}
            title={form.title}
            onTitleChange={handleChange("title")}
            canEdit={canEdit}
            onClose={onClose}
          />

          <div className="flex flex-row flex-1 min-h-0 overflow-hidden">
            <div className="flex-1 min-w-0 px-6 py-5 flex flex-col gap-6 overflow-y-auto overscroll-contain border-r border-slate-100">
              <CardSourceSection cardId={card.id} boardId={boardId} />
              <CardDescriptionField
                value={form.description}
                onChange={handleChange("description")}
                canEdit={canEdit}
              />
              <CardSubtaskSection
                cardId={card.id}
                boardId={boardId}
                subtasks={card.subtasks}
                canEdit={canEdit}
                onAddSubtask={onAddSubtask}
              />
              {/* Optional dev fields — collapsed behind "+ Add" by default */}
              <CardDevFields
                acceptanceValue={form.acceptance_criteria}
                onAcceptanceChange={handleChange("acceptance_criteria")}
                noteValue={form.implementation_note}
                onNoteChange={handleChange("implementation_note")}
                canEdit={canEdit}
              />
            </div>

            <div className="w-56 shrink-0 px-5 py-5 bg-slate-50 overflow-y-auto overscroll-contain">
              <CardFormFields
                form={form}
                members={members}
                assigneeName={assigneeName}
                boardId={boardId}
                onChange={handleChange}
                onTagsChange={setTags}
                error={error}
                canEdit={canEdit}
              />
            </div>
          </div>

          <CardModalFooter
            canEdit={canEdit}
            isDirty={isDirty}
            isSaving={isSaving}
            cardTitle={card.title}
            onSave={handleSave}
            onDelete={() => onDelete(card.id)}
            onClose={onClose}
          />
        </div>
      </div>
    </>,
    document.body,
  );
}
