// components/board/BoardSettingsForm.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { API_URL } from "@/lib/constants";
import { Board } from "@/types/board";
import { BoardMembersSection } from "./members/BoardMembersSection";

interface BoardSettingsFormProps {
  boardId: string;
  board: Board;
}

interface EditableFieldProps {
  title: string;
  description: string;
  initialValue: string | number;
  type?: "text" | "number";
  fieldKey: "title" | "budget";
  boardId: string;
  prefix?: string;
}

function EditableField({
  title,
  description,
  initialValue,
  type = "text",
  fieldKey,
  boardId,
  prefix,
}: EditableFieldProps) {
  const router = useRouter();
  const [value, setValue] = useState(String(initialValue || ""));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = value.trim() !== String(initialValue || "").trim();

  const handleSave = async () => {
    const cleanValue = value.trim();

    // Validation เบื้องต้น
    if (fieldKey === "title" && !cleanValue) {
      setError("Cannot be empty.");
      return;
    }
    if (fieldKey === "budget") {
      const num = parseFloat(cleanValue);
      if (isNaN(num) || num < 0) {
        setError("Invalid number.");
        return;
      }
    }

    setIsSaving(true);
    setError(null);

    try {

      const payload = {
        [fieldKey]: type === "number" ? parseFloat(cleanValue) : cleanValue,
      };

      const res = await fetch(`${API_URL}/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to save");

      setIsEditing(false);
      router.refresh();
    } catch (err) {
      setError("Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setValue(String(initialValue || ""));
    setIsEditing(false);
    setError(null);
  };

  return (
    <div className="py-6 border-b border-slate-200 flex flex-col md:flex-row gap-6">
      <div className="md:w-64 shrink-0">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex-1 max-w-md">
        {!isEditing ? (
          // โหมดแสดงผล (คลิกเพื่อแก้ไข)
          <div
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-white hover:border-blue-400 transition-colors group flex justify-between items-center"
          >
            <span className="text-slate-700">
              {prefix}
              {value || <span className="text-slate-400 italic">Not set</span>}
            </span>
            <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to edit
            </span>
          </div>
        ) : (
          // โหมดแก้ไข
          <div className="space-y-2">
            <div className="flex gap-2 relative">
              {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10">
                  {prefix}
                </span>
              )}
              <input
                type={type}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError(null);
                }}
                step={type === "number" ? "0.01" : undefined}
                className={`flex-1 w-full ${prefix ? "pl-7 pr-3" : "px-3"} py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? "border-red-500 focus:ring-red-500" : "border-slate-300"}`}
                autoFocus
              />

              {/* ปุ่ม Save & Cancel ย่อยประจำฟิลด์ */}
              <button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="shrink-0 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Check size={16} />
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="shrink-0 p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export function BoardSettingsForm({ boardId, board }: BoardSettingsFormProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* General */}
      <EditableField
        title="Board Name"
        description="This is the display name of your board visible to all members."
        initialValue={board?.title}
        fieldKey="title"
        boardId={boardId}
      />

      <EditableField
        title="Budget"
        description="Total budget allocated for this project. Used for cost tracking."
        initialValue={board?.budget}
        type="number"
        fieldKey="budget"
        boardId={boardId}
        prefix="$"
      />
      <BoardMembersSection boardId={boardId} />
      {/* Danger Zone */}
      <div className="mt-8 border border-red-200 rounded-xl overflow-hidden">
        <div className="px-5 py-4 bg-red-50 border-b border-red-200 flex items-center gap-2">
          <AlertTriangle size={16} className="text-red-600" />
          <h2 className="text-sm font-bold text-red-700">Danger Zone</h2>
        </div>

        <div className="px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-700">
              Delete this board
            </p>
            <p className="text-sm text-slate-500 mt-0.5">
              Permanently remove this board and all its data. This cannot be
              undone.
            </p>
          </div>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2 border border-red-400 text-red-600 text-sm font-semibold rounded-lg hover:bg-red-600 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isDeleting && <Loader2 size={14} className="animate-spin" />}
            Delete board
          </button>
        </div>
      </div>
    </div>
  );
}
