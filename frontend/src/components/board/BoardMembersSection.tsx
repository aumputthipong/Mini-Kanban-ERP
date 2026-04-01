// components/board/BoardMembersSection.tsx
"use client";

import { useState, useEffect } from "react";
import { UserPlus, X, Loader2 } from "lucide-react";
import type { BoardMember, User } from "@/types/board";
import { API_URL } from "@/lib/constants";

const ROLE_LABELS: Record<string, string> = {
  owner:  "Owner",
  manager:  "Manager",
  member: "Member",
};

const ROLE_COLORS: Record<string, string> = {
  owner:  "bg-purple-100 text-purple-700",
  manager:  "bg-blue-100 text-blue-700",
  member: "bg-slate-100 text-slate-600",
};

interface BoardMembersSectionProps {
  boardId: string;
}

export function BoardMembersSection({ boardId }: BoardMembersSectionProps) {
  const [members, setMembers]           = useState<BoardMember[]>([]);
  const [allUsers, setAllUsers]         = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState<"manager" | "member">("member");
  const [isAdding, setIsAdding]         = useState(false);
  const [loadingId, setLoadingId]       = useState<string | null>(null);
  const [error, setError]               = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/boards/${boardId}/members`, { credentials: "include" }),
          fetch(`${API_URL}/users`, { credentials: "include" }),
        ]);
        if (membersRes.ok) setMembers(await membersRes.json());
        if (usersRes.ok)   setAllUsers(await usersRes.json());
      } catch {
        setError("Failed to load members.");
      }
    };
    fetchData();
  }, [boardId]);

  // กรอง user ที่ยังไม่ได้เป็น member
  const memberIds  = new Set(members.map((m) => m.user_id));
  const nonMembers = allUsers.filter((u) => !memberIds.has(u.id));

  const handleAdd = async () => {
    if (!selectedUserId) return;
    setIsAdding(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/members`, {
        method:      "POST",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ user_id: selectedUserId, role: selectedRole }),
      });
      if (!res.ok) throw new Error("Failed to add member.");

      // refresh members
      const updated = await fetch(`${API_URL}/boards/${boardId}/members`, {
        credentials: "include",
      });
      if (updated.ok) setMembers(await updated.json());
      setSelectedUserId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemove = async (userId: string) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/members/${userId}`, {
        method:      "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to remove member.");
      setMembers((prev) => prev.filter((m) => m.user_id !== userId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingId(null);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/members/${userId}`, {
        method:      "PATCH",
        credentials: "include",
        headers:     { "Content-Type": "application/json" },
        body:        JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role.");
      setMembers((prev) =>
        prev.map((m) => m.user_id === userId ? { ...m, role: role as BoardMember["role"] } : m)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="py-6 border-b border-slate-200">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 shrink-0">
          <h2 className="text-sm font-semibold text-slate-800">Members</h2>
          <p className="text-sm text-slate-500 mt-1 leading-relaxed">
            Manage who has access to this board and their roles.
          </p>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          {/* Add member */}
          <div className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1 text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
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
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="member">Member</option>
              <option value="manager">Manager</option>
            </select>

            <button
              onClick={handleAdd}
              disabled={!selectedUserId || isAdding}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 disabled:opacity-40 transition-colors"
            >
              {isAdding
                ? <Loader2 size={14} className="animate-spin" />
                : <UserPlus size={14} />
              }
              Add
            </button>
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          {/* Members list */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            {members.length === 0 ? (
              <p className="p-4 text-sm text-slate-400 text-center">No members yet.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {members.map((member) => {
                  const isLoading = loadingId === member.user_id;
                  return (
                    <div key={member.id} className="flex items-center justify-between p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {member.full_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-700">
                            {member.full_name}
                          </p>
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
                            onChange={(e) => handleRoleChange(member.user_id, e.target.value)}
                            disabled={isLoading}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-40"
                          >
                            <option value="manager">Manager</option>
                            <option value="member">Member</option>
                          </select>
                        )}

                        {member.role !== "owner" && (
                          <button
                            onClick={() => handleRemove(member.user_id)}
                            disabled={isLoading}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          >
                            {isLoading
                              ? <Loader2 size={14} className="animate-spin" />
                              : <X size={14} />
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}