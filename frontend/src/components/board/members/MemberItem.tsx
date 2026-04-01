// components/board/members/MemberItem.tsx
import { X, Loader2 } from "lucide-react";
import type { BoardMember } from "@/types/board";

const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  manager: "Manager",
  member: "Member",
};

const ROLE_COLORS: Record<string, string> = {
  owner: "bg-purple-100 text-purple-700",
  manager: "bg-blue-100 text-blue-700",
  member: "bg-slate-100 text-slate-600",
};

interface MemberItemProps {
  member: BoardMember;
  isLoading: boolean;
  onRoleChange: (userId: string, role: string) => void;
  onRemove: (userId: string) => void;
}

export function MemberItem({ member, isLoading, onRoleChange, onRemove }: MemberItemProps) {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
          {member.full_name.charAt(0).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">{member.full_name}</p>
          <p className="text-xs text-slate-400">{member.email}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {member.role === "owner" ? (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${ROLE_COLORS.owner}`}>
            {ROLE_LABELS.owner}
          </span>
        ) : (
          <select
            value={member.role}
            onChange={(e) => onRoleChange(member.user_id, e.target.value)}
            disabled={isLoading}
            className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40"
          >
            <option value="manager">Manager</option>
            <option value="member">Member</option>
          </select>
        )}

        {member.role !== "owner" && (
          <button
            onClick={() => onRemove(member.user_id)}
            disabled={isLoading}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
            title="Remove member"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
          </button>
        )}
      </div>
    </div>
  );
}