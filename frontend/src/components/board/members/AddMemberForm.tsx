// components/board/members/AddMemberForm.tsx
import { useState } from "react";
import { UserPlus, Loader2 } from "lucide-react";
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
    if (success) {
      setSelectedUserId("");
    }
  };

  return (
    <div className="flex gap-2">
      <select
        value={selectedUserId}
        onChange={(e) => setSelectedUserId(e.target.value)}
        disabled={isAdding}
        className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
      >
        <option value="">Select a user to add...</option>
        {nonMembers.map((u) => (
          <option key={u.id} value={u.id}>
            {u.full_name} ({u.email})
          </option>
        ))}
      </select>

      <select
        value={selectedRole}
        onChange={(e) => setSelectedRole(e.target.value as "manager" | "member")}
        disabled={isAdding}
        className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50"
      >
        <option value="member">Member</option>
        <option value="manager">Manager</option>
      </select>

      <button
        onClick={handleSubmit}
        disabled={!selectedUserId || isAdding}
        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-colors"
      >
        {isAdding ? <Loader2 size={14} className="animate-spin" /> : <UserPlus size={14} />}
        Add
      </button>
    </div>
  );
}