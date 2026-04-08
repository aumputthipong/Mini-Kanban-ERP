// components/board/settings/DangerZone.tsx
import { useState } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface DangerZoneProps {
  onDelete: () => void;
  isDeleting: boolean;
}

export function DangerZone({ onDelete, isDeleting }: DangerZoneProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className="mt-8 border border-red-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="px-5 py-4 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600" />
          <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
        </div>

        <div className="px-5 py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Delete this board</p>
            <p className="text-sm text-slate-500 mt-0.5">
              Permanently remove this board and all its data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={isDeleting}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-red-400 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Delete board
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete this board?"
        description="All columns, tasks, and data will be permanently deleted. This cannot be undone."
        confirmLabel="Delete board"
        destructive
        onConfirm={() => { setConfirmOpen(false); onDelete(); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}