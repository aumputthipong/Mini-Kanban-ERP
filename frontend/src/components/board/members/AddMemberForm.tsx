// components/board/members/AddMemberForm.tsx
import { useState } from "react";
import { Users, ChevronDown, UserPlus, Loader2 } from "lucide-react";
import type { User } from "@/types/board";

interface AddMemberFormProps {
  nonMembers: User[];
  isAdding: boolean;
  onAdd: (userId: string, role: string) => Promise<boolean>;
}

export function AddMemberForm({ nonMembers, isAdding, onAdd }: AddMemberFormProps) {
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"manager" | "member">("member");

  const handleSubmit = async () => {
    if (!selectedUserId) return;
    const success = await onAdd(selectedUserId, selectedRole);
    if (success) setSelectedUserId("");
  };

  return (
    <div className="p-3">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* user picker — styled as one cohesive field */}
        <label className="flex h-10 min-w-0 flex-1 items-center gap-2.5 rounded-md border border-slate-200 bg-slate-50/70 px-3 transition focus-within:border-indigo-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-900/10">
          <Users size={18} className="shrink-0 text-slate-400" />
          <div className="relative min-w-0 flex-1">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              disabled={isAdding}
              className={`w-full appearance-none truncate border-0 bg-transparent pr-6 text-sm outline-none disabled:opacity-50 ${
                selectedUserId ? "text-slate-900" : "text-slate-400"
              }`}
            >
              <option value="">เลือกสมาชิกในเวิร์กสเปซเพื่อเพิ่มเข้าบอร์ด…</option>
              {nonMembers.map((u) => (
                <option key={u.id} value={u.id} className="text-slate-900">
                  {u.full_name} ({u.email})
                </option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-slate-400"
            />
          </div>
        </label>

        {/* role select */}
        <div className="relative shrink-0">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as "manager" | "member")}
            disabled={isAdding}
            aria-label="role for invite"
            className="h-10 cursor-pointer appearance-none rounded-md border border-slate-200 bg-white pl-3 pr-8 text-[13.5px] font-semibold text-slate-900 transition hover:border-slate-300 disabled:opacity-50"
          >
            <option value="member">Member</option>
            <option value="manager">Manager</option>
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>

        <button
          onClick={handleSubmit}
          disabled={!selectedUserId || isAdding}
          className="inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap rounded-md bg-blue-800 px-4 text-[14px] font-bold text-white shadow-sm transition hover:bg-blue-900 disabled:opacity-40"
        >
          {isAdding ? <Loader2 size={17} className="animate-spin" /> : <UserPlus size={17} />}
          เพิ่มสมาชิก
        </button>
      </div>
    </div>
  );
}
