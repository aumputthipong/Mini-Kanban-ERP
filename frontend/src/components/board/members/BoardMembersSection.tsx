// components/board/BoardMembersSection.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Loader2 } from "lucide-react";
import { useBoardMembers } from "../../../hooks/useBoardMembers";
import { AddMemberForm } from "./AddMemberForm";
import { MemberItem } from "./MemberItem";
import { useCanInviteMembers, useBoardRole } from "@/hooks/useBoardRole";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface BoardMembersSectionProps {
  boardId: string;
}

export function BoardMembersSection({ boardId }: BoardMembersSectionProps) {
  const {
    members,
    nonMembers,
    isAdding,
    loadingId,
    error,
    addMember,
    removeMember,
    changeRole,
    leaveBoard,
  } = useBoardMembers(boardId);
  const canInvite = useCanInviteMembers();
  const role = useBoardRole();
  const router = useRouter();
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const canLeave = role !== null && role !== "owner";

  const handleLeave = async () => {
    setLeaving(true);
    const ok = await leaveBoard();
    setLeaving(false);
    if (ok) router.push("/dashboard");
  };

  return (
    <div className="py-6 border-b border-slate-200">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Header */}
        <div className="md:w-64 shrink-0">
          <h2 className="text-sm font-semibold text-slate-800">Members</h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Manage who has access to this board and their roles.
          </p>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col gap-4">
          {canInvite && (
            <AddMemberForm
              nonMembers={nonMembers}
              isAdding={isAdding}
              onAdd={addMember}
            />
          )}

          {error && <p className="text-sm text-red-500">{error}</p>}

          {canLeave && (
            <div className="flex justify-end">
              <button
                onClick={() => setLeaveConfirmOpen(true)}
                disabled={leaving}
                className="cursor-pointer flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {leaving ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                Leave board
              </button>
            </div>
          )}

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {members.length === 0 ? (
              <p className="p-4 text-sm text-slate-400 text-center">
                No members yet.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {[...members]
                  .sort((a, b) => (a.role === "owner" ? -1 : b.role === "owner" ? 1 : 0))
                  .map((member) => (
                  <MemberItem
                    key={member.id}
                    member={member}
                    isLoading={loadingId === member.user_id}
                    onRoleChange={changeRole}
                    onRemove={removeMember}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={leaveConfirmOpen}
        title="Leave board"
        description="You will lose access to this board immediately. You can be re-invited by a manager or the owner."
        confirmLabel="Leave"
        destructive
        onConfirm={() => {
          setLeaveConfirmOpen(false);
          handleLeave();
        }}
        onCancel={() => setLeaveConfirmOpen(false)}
      />
    </div>
  );
}
