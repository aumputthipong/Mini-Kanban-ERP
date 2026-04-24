// components/board/BoardMembersSection.tsx
"use client";

import { useBoardMembers } from "../../../hooks/useBoardMembers";
import { AddMemberForm } from "./AddMemberForm";
import { MemberItem } from "./MemberItem";
import { useCanInviteMembers } from "@/hooks/useBoardRole";

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
  } = useBoardMembers(boardId);
  const canInvite = useCanInviteMembers();

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
    </div>
  );
}
