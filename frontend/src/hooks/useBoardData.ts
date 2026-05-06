// hooks/useBoardData.ts
import { useState, useEffect } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import { API_URL } from "@/lib/constants";

/**
 * Bootstraps a board view by hydrating `useBoardStore` in three parallel
 * fetches: columns + cards, current user, member list. Should be called
 * once at the board page root — subsequent updates flow through WebSocket
 * broadcasts, not refetches.
 *
 * Returns `{ isLoading, error }` for the page to render skeleton / 404 /
 * generic error states. The string `"NOT_FOUND"` is used as a sentinel for
 * 404 (board missing or not a member) so the page can show a tailored
 * message instead of the generic error UI.
 */
export function useBoardData(boardId: string) {
  const { setColumns, setCurrentUser, setBoardMembers, setLoading } = useBoardStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) return;

    const fetchAll = async () => {
      setIsLoading(true);
      setLoading(true);
      setError(null);
      try {
        const [boardRes, meRes, membersRes] = await Promise.all([
          fetch(`${API_URL}/boards/${boardId}`, { credentials: "include" }),
          fetch(`${API_URL}/auth/me`, { credentials: "include" }),
          fetch(`${API_URL}/boards/${boardId}/members`, { credentials: "include" }),
        ]);

        if (boardRes.status === 404) {
          setError("NOT_FOUND");
          return;
        }
        if (!boardRes.ok) throw new Error(`Failed to load board (${boardRes.status})`);

        const [boardData, meData, membersData] = await Promise.all([
          boardRes.json(),
          meRes.ok ? meRes.json() : Promise.resolve(null),
          membersRes.ok ? membersRes.json() : Promise.resolve([]),
        ]);

        setColumns(boardData);
        if (meData?.user_id) setCurrentUser(meData.user_id);
        setBoardMembers(
          Array.isArray(membersData) ? membersData.filter(Boolean) : []
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
        setLoading(false);
      }
    };

    fetchAll();
  }, [boardId]);

  return { isLoading, error };
}