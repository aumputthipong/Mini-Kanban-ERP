// components/board/settings/EditableField.tsx
"use client";

import { useState } from "react";
import { Check, Loader2, X } from "lucide-react";

interface EditableFieldProps {
  title: string;
  description: string;
  initialValue: string | number;
  type?: "text" | "number";
  fieldKey: "title" | "budget";
  prefix?: string;
  onSave: (fieldKey: string, value: string | number) => Promise<void>;
}

export function EditableField({
  title,
  description,
  initialValue,
  type = "text",
  fieldKey,
  prefix,
  onSave,
}: EditableFieldProps) {
  const [value, setValue] = useState(String(initialValue || ""));
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = value.trim() !== String(initialValue || "").trim();

  const handleSave = async () => {
    const cleanValue = value.trim();

    // Validation
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
      // โยนค่ากลับไปให้ Hook ทำงาน
      await onSave(fieldKey, type === "number" ? parseFloat(cleanValue) : cleanValue);
      setIsEditing(false);
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
    <div className="py-6 border-b border-slate-100 flex flex-col md:flex-row gap-6">
      <div className="md:w-64 shrink-0">
        <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-1 leading-relaxed">{description}</p>
      </div>

      <div className="flex-1 max-w-md">
        {!isEditing ? (
          <div
            onClick={() => setIsEditing(true)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-white hover:border-blue-400 transition-colors group flex justify-between items-center"
          >
            <span className="text-slate-700 font-medium">
              {prefix}
              {value || <span className="text-slate-400 italic font-normal">Not set</span>}
            </span>
            <span className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
              Click to edit
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2 relative">
              {prefix && (
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10 font-medium">
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
                className={`flex-1 w-full ${prefix ? "pl-7 pr-3" : "px-3"} py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? "border-red-500 focus:ring-red-200" : "border-slate-300"}`}
                autoFocus
              />

              <button
                onClick={handleSave}
                disabled={isSaving || !isDirty}
                className="shrink-0 p-2 bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
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