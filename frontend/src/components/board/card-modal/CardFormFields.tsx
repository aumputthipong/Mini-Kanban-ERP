// components/kanban/card-modal/CardFormFields.tsx
import { Calendar, Clock, User } from "lucide-react";
import { Chip } from "@mui/material";
import type { BoardMember } from "@/types/board";
import { FormState } from "./CardDetailModal";

const PRIORITY_OPTIONS = ["low", "medium", "high"] as const;
const priorityColor: Record<string, "success" | "warning" | "error" | "default"> = {
  low: "success",
  medium: "warning",
  high: "error",
};

interface CardFormFieldsProps {
  form: FormState;
  members: BoardMember[];
  assigneeName?: string;
  onChange: (field: keyof FormState) => (e: React.ChangeEvent<any>) => void;
  error: string | null;
}

export function CardFormFields({ form, members, assigneeName, onChange, error }: CardFormFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Description */}
      <div>
        <label className="text-xs font-bold text-slate-400 uppercase block mb-1 pt-2">Description</label>
        <textarea
          rows={3}
          value={form.description}
          onChange={onChange("description")}
          placeholder="Add a description..."
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Priority */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-1">Priority</label>
          <select
            value={form.priority}
            onChange={onChange("priority")}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">None</option>
            {PRIORITY_OPTIONS.map((p) => (
              <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
            ))}
          </select>
        </div>

        {/* Due Date */}
       {/* Due Date */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
            <Calendar size={11} /> Due Date
          </label>
          
          <input
            type="date"
            value={form.due_date}
            onChange={onChange("due_date")}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 text-slate-600"
          />

          {/* Hot Choices Buttons */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "Today", days: 0 },
              { label: "Tomorrow", days: 1 },
              { label: "3 Days", days: 3 },
              { label: "1 Week", days: 7 },
            ].map((choice) => {
              // คำนวณวันที่เป้าหมาย (YYYY-MM-DD)
              const targetDate = new Date();
              targetDate.setDate(targetDate.getDate() + choice.days);
              // ป้องกันปัญหา Timezone แกว่ง ให้ปรับเวลาท้องถิ่นก่อน
              const formattedDate = new Date(targetDate.getTime() - (targetDate.getTimezoneOffset() * 60000))
                .toISOString()
                .split("T")[0];

              // เช็คว่าปุ่มนี้คือวันที่กำลังเลือกอยู่หรือไม่ (เพื่อทำไฮไลท์สี)
              const isActive = form.due_date === formattedDate;

              return (
                <button
                  key={choice.label}
                  type="button" // สำคัญ: ป้องกันไม่ให้ปุ่มนี้เผลอ Submit Form
                  onClick={() => {
                    // ส่งค่าจำลอง (Mock Event) เข้าไปให้ onChange ของคุณ
                    onChange("due_date")({
                      target: { value: formattedDate },
                    } as any);
                  }}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors border ${
                    isActive
                      ? "bg-blue-50 border-blue-200 text-blue-700" // สีตอนถูกเลือก
                      : "bg-white border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-800" // สีปกติ
                  }`}
                >
                  {choice.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Assignee */}
        <div>
          <label className="text-xs font-bold text-slate-400 uppercase block mb-1 flex items-center gap-1">
            <User size={11} /> Assignee
          </label>
          <select
            value={form.assignee_id}
            onChange={onChange("assignee_id")}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name} ({m.email})
              </option>
            ))}
          </select>
        </div>

      {/* Estimated Hours */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
            <Clock size={11} /> Estimated Hours
          </label>
          
          <input
            type="number"
            min="0"
            step="0.5"
            value={form.estimated_hours}
            onChange={onChange("estimated_hours")}
            placeholder="0"
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />

          {/* Hot Choices Buttons for Hours */}
          <div className="flex flex-wrap gap-2">
            {[
              { label: "1h", value: "1" },
              { label: "2h", value: "2" },
              { label: "4h", value: "4" },
              { label: "8h", value: "8" },
            ].map((choice) => {
              // เช็คว่าค่าใน input ตรงกับปุ่มนี้ไหม (แปลงค่าเป็น String เพื่อเปรียบเทียบให้ชัวร์)
              const isActive = form.estimated_hours === choice.value;

              return (
                <button
                  key={choice.label}
                  type="button"
                  onClick={() => {
                    // ส่งค่าจำลอง (Mock Event) เข้าไปให้ onChange
                    onChange("estimated_hours")({
                      target: { value: choice.value },
                    } as any);
                  }}
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
        </div>
      </div>

      {/* Previews */}
      {assigneeName && (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
            {assigneeName.charAt(0).toUpperCase()}
          </div>
          <span className="text-xs text-slate-500">
            Assigned to <span className="font-semibold text-slate-700">{assigneeName}</span>
          </span>
        </div>
      )}

      {form.priority && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Preview:</span>
          <Chip label={form.priority.toUpperCase()} color={priorityColor[form.priority]} size="small" />
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}