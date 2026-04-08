// components/board/members/MemberItem.tsx
import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { BoardMember } from "@/types/board";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  const isOwner = member.role === "owner";
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <>
      <div className={`flex items-center justify-between p-4 transition-colors ${
        isOwner
          ? "bg-purple-50/60 hover:bg-purple-50 border-l-2 border-purple-300"
          : "hover:bg-slate-50"
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
            isOwner ? "bg-purple-500" : "bg-blue-500"
          }`}>
            {member.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-700">{member.full_name}</p>
            <p className="text-xs text-slate-400">{member.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isOwner ? (
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

          {!isOwner && (
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
              title="Remove member"
            >
              {isLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
            </button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Remove member"
        description={`Remove ${member.full_name} from this board? They will lose access immediately.`}
        confirmLabel="Remove"
        destructive
        onConfirm={() => { setConfirmOpen(false); onRemove(member.user_id); }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}