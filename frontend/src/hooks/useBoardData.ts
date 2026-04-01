// hooks/useBoardData.ts
import { useState, useEffect } from "react";
import { useBoardStore } from "@/store/useBoardStore";
import { API_URL } from "@/lib/constants";

export function useBoardData(boardId: string) {
  const { setColumns } = useBoardStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) return;
    
    const fetchBoardData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_URL}/boards/${boardId}`, {
          credentials: "include",
        });
        if (!response.ok) {
          throw new Error(`Failed to load board (${response.status})`);
        }
        const data = await response.json();
        setColumns(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId, setColumns]);

  return { isLoading, error };
}