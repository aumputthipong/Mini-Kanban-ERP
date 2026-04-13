// components/kanban/card-modal/CardFormFields.tsx
"use client";

import { useState } from "react";
import { Calendar, Clock, User } from "lucide-react";
import type { BoardMember } from "@/types/board";
import { FormState } from "./CardDetailModal";
import { formatThaiDate } from "@/utils/date_helper";
import { QUICK_DATE_OPTIONS, QUICK_HOURS_OPTIONS } from "@/utils/quickSelect";
import { getAvatarColor } from "@/utils/avatar";

interface CardFormFieldsProps {
  form: FormState;
  members: BoardMember[];
  assigneeName?: string;
  onChange: (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  error: string | null;
  canEdit: boolean;
}

export function CardFormFields({ form, members, assigneeName, onChange, error, canEdit }: CardFormFieldsProps) {
  const [showQuickDates, setShowQuickDates] = useState(false);
  const [showQuickHours, setShowQuickHours] = useState(false);

  return (
    <div className="flex flex-col gap-5">
      {/* Assignee */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
          <User size={10} /> Assignee
        </label>
        {canEdit ? (
          <select
            value={form.assignee_id}
            onChange={onChange("assignee_id")}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name} ({m.email})
              </option>
            ))}
          </select>
        ) : (
          <div className="flex items-center gap-2 px-1">
            {assigneeName ? (
              <>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${getAvatarColor(form.assignee_id)}`}>
                  {assigneeName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-slate-700">{assigneeName}</span>
              </>
            ) : (
              <span className="text-sm text-slate-400 italic">Unassigned</span>
            )}
          </div>
        )}
      </div>

      {/* Priority */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          Priority
        </label>
        {canEdit ? (
          <div className="flex gap-1.5">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() =>
                  onChange("priority")({
                    target: { value: p },
                  } as React.ChangeEvent<HTMLInputElement>)
                }
                className={`flex-1 py-1.5 text-[11px] font-bold rounded-md border capitalize transition-colors ${
                  form.priority === p
                    ? p === "high"
                      ? "bg-red-50 text-red-700 border-red-300"
                      : p === "medium"
                        ? "bg-amber-50 text-amber-700 border-amber-300"
                        : "bg-emerald-50 text-emerald-700 border-emerald-300"
                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-400"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600 px-1">
            {form.priority ? form.priority.charAt(0).toUpperCase() + form.priority.slice(1) : "—"}
          </p>
        )}
      </div>

      {/* Due Date */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
          <Calendar size={10} /> Due Date
        </label>
        {canEdit ? (
          <>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                value={form.due_date}
                onChange={onChange("due_date")}
                className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-600"
              />
              <button
                type="button"
                onClick={() => setShowQuickDates((v) => !v)}
                className="text-[10px] text-slate-400 hover:text-blue-600 px-1.5 py-1 rounded border border-slate-200 hover:border-blue-300 transition-colors shrink-0"
              >
                Quick
              </button>
            </div>
            {showQuickDates && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_DATE_OPTIONS.map((choice) => {
                  const targetDate = new Date();
                  targetDate.setDate(targetDate.getDate() + choice.days);
                  const formattedDate = new Date(
                    targetDate.getTime() - targetDate.getTimezoneOffset() * 60000,
                  )
                    .toISOString()
                    .split("T")[0];
                  const isActive = form.due_date === formattedDate;
                  return (
                    <button
                      key={choice.label}
                      type="button"
                      onClick={() =>
                        onChange("due_date")({
                          target: { value: formattedDate },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors border ${
                        isActive
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600 px-1">{formatThaiDate(form.due_date) || "—"}</p>
        )}
      </div>

      {/* Estimated Hours */}
      <div>
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
          <Clock size={10} /> Est. Hours
        </label>
        {canEdit ? (
          <>
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min="0"
                step="0.5"
                value={form.estimated_hours}
                onChange={onChange("estimated_hours")}
                placeholder="0"
                className="flex-1 min-w-0 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowQuickHours((v) => !v)}
                className="text-[10px] text-slate-400 hover:text-blue-600 px-1.5 py-1 rounded border border-slate-200 hover:border-blue-300 transition-colors shrink-0"
              >
                Quick
              </button>
            </div>
            {showQuickHours && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {QUICK_HOURS_OPTIONS.map((choice) => {
                  const isActive = form.estimated_hours === choice.value;
                  return (
                    <button
                      key={choice.label}
                      type="button"
                      onClick={() =>
                        onChange("estimated_hours")({
                          target: { value: choice.value },
                        } as React.ChangeEvent<HTMLInputElement>)
                      }
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors border ${
                        isActive
                          ? "bg-blue-50 border-blue-200 text-blue-700"
                          : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                      }`}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-slate-600 px-1">
            {form.estimated_hours ? `${form.estimated_hours}h` : "—"}
          </p>
        )}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
