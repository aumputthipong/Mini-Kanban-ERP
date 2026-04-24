// components/board/settings/BoardSettingsForm.tsx
"use client";

import { Board } from "@/types/board";
import { useBoardSettings } from "@/hooks/useBoardSettings";
import { EditableField } from "./DangerZone";
import { DangerZone } from "./EditableField";
import { useCanManageBoard, useCanDeleteBoard } from "@/hooks/useBoardRole";


interface BoardSettingsFormProps {
  boardId: string;
  board: Board;
}

export function BoardSettingsForm({ boardId, board }: BoardSettingsFormProps) {
  const { updateField, deleteBoard, isDeleting } = useBoardSettings(boardId);
  const canManage = useCanManageBoard();
  const canDelete = useCanDeleteBoard();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
        <h2 className="text-lg font-bold text-slate-800 mb-2 border-b border-slate-100 pb-4">
          General Settings
        </h2>

        <EditableField
          title="Board Name"
          description="This is the display name of your board visible to all members."
          initialValue={board?.title}
          fieldKey="title"
          onSave={updateField}
          readOnly={!canManage}
        />

        <EditableField
          title="Budget"
          description="Total budget allocated for this project. Used for cost tracking."
          initialValue={board?.budget ?? 0}
          type="number"
          fieldKey="budget"
          prefix="$"
          onSave={updateField}
          readOnly={!canManage}
        />

      {canDelete && (
        <DangerZone onDelete={deleteBoard} isDeleting={isDeleting} />
      )}
    </div>
  );
}