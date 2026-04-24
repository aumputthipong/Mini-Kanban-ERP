// components/board/members/useBoardMembers.ts
import { useState, useEffect, useMemo } from "react";
import type { BoardMember, User } from "@/types/board";
import { API_URL } from "@/lib/constants";
import { apiClient } from "@/lib/apiClient";
import { useBoardStore } from "@/store/useBoardStore";

export function useBoardMembers(boardId: string) {
  const [members, setMembers] = useState<BoardMember[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setBoardMembers } = useBoardStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. โค้ดสั้นและสะอาดขึ้นมาก ไม่ต้องสนใจเรื่อง JSON หรือ Header อีกต่อไป
        const [membersData, usersData] = await Promise.all([
          apiClient(`/boards/${boardId}/members`),
          apiClient(`/users`),
        ]);

        setMembers(Array.isArray(membersData) ? membersData.filter(Boolean) : []);
        setAllUsers(Array.isArray(usersData) ? usersData.filter(Boolean) : []);
      } catch (err) {
        setError("Failed to load members or users.");
      }
    };

    loadData();
  }, [boardId]);
  const nonMembers = useMemo(() => {
    const memberIds = new Set(members.filter(Boolean).map((m) => m.user_id));
    return allUsers.filter((u) => !memberIds.has(u.id));
  }, [members, allUsers]);

  const addMember = async (userId: string, role: string) => {
    setIsAdding(true);
    setError(null);
    try {
      await apiClient(`/boards/${boardId}/members`, {
        data: { user_id: userId, role },
      });
      // Re-fetch the full list so the UI reflects the actual DB state
      const fresh: BoardMember[] = await apiClient(`/boards/${boardId}/members`);
      const cleaned = Array.isArray(fresh) ? fresh.filter(Boolean) : [];
      setMembers(cleaned);
      setBoardMembers(cleaned); // sync Zustand so MemberFilterBar also updates
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
      // apiClient จัดการเรื่อง credentials และเช็ค error status ให้
      await apiClient(`/boards/${boardId}/members/${userId}`, {
        method: "DELETE",
      });

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
      // apiClient จัดการเรื่อง Headers และแปลง data เป็น JSON ให้
      await apiClient(`/boards/${boardId}/members/${userId}`, {
        method: "PATCH",
        data: { role },
      });

      setMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? { ...m, role: role as BoardMember["role"] } : m))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoadingId(null);
    }
  };

  const leaveBoard = async () => {
    setError(null);
    try {
      await apiClient(`/boards/${boardId}/members/me`, { method: "DELETE" });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      return false;
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
    leaveBoard,
  };
}