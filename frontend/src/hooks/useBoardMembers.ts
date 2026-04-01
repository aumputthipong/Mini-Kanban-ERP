// components/board/members/useBoardMembers.ts
import { useState, useEffect, useMemo } from "react";
import type { BoardMember, User } from "@/types/board";
import { API_URL } from "@/lib/constants";

export function useBoardMembers(boardId: string) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [membersRes, usersRes] = await Promise.all([
          fetch(`${API_URL}/boards/${boardId}/members`, { credentials: "include" }),
          fetch(`${API_URL}/users`, { credentials: "include" }),
        ]);
        if (membersRes.ok) setMembers(await membersRes.json());
        if (usersRes.ok) setAllUsers(await usersRes.json());
      } catch {
        setError("Failed to load members.");
      }
    };
    fetchData();
  }, [boardId]);

  const nonMembers = useMemo(() => {
    const memberIds = new Set(members.map((m) => m.user_id));
    return allUsers.filter((u) => !memberIds.has(u.id));
  }, [members, allUsers]);

  const addMember = async (userId: string, role: string) => {
    setIsAdding(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/members`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, role }),
      });
      if (!res.ok) throw new Error("Failed to add member.");

      const updated = await fetch(`${API_URL}/boards/${boardId}/members`, { credentials: "include" });
      if (updated.ok) setMembers(await updated.json());
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  const removeMember = async (userId: string) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/members/${userId}`, {
        method: "DELETE",
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

  const changeRole = async (userId: string, role: string) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/members/${userId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      if (!res.ok) throw new Error("Failed to update role.");
      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: role as BoardMember["role"] } : m))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingId(null);
    }
  };

  return {
    members,
    nonMembers,
    isAdding,
    loadingId,
    error,
    addMember,
    removeMember,
    changeRole,
  };
}