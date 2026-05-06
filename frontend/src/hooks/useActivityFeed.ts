"use client";
import { useEffect } from "react";
import { API_URL } from "@/lib/constants";
import { useActivityStore } from "@/store/useActivityStore";

/**
 * Loads the initial activity feed for a board into `useActivityStore` and
 * returns the live values (`activities`, `loading`, `error`) for the UI.
 *
 * After this hook hydrates the store, new entries flow in via the
 * `ACTIVITY_CREATED` WebSocket event (handled by `useWebSocket`) — this hook
 * does **not** poll. Switching boards calls `reset()` so a stale feed never
 * leaks to the new view. The fetch is cancellable; unmounting mid-flight
 * silently drops the result.
 *
 * @param boardId  Board to load — pass `undefined` to skip (e.g. before the
 *                 route param is ready).
 * @param limit    Max entries to fetch in the initial page (default 30).
 */
export function useActivityFeed(boardId: string | undefined, limit = 30) {
  const activities = useActivityStore((s) => s.activities);
  const loading = useActivityStore((s) => s.loading);
  const error = useActivityStore((s) => s.error);

  useEffect(() => {
    if (!boardId) return;
    const store = useActivityStore.getState();
    store.reset();
    store.setLoading(true);

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/boards/${boardId}/activities?limit=${limit}`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error(`Failed to fetch activities: ${res.status}`);
        const data = await res.json();
        if (cancelled) return;
        useActivityStore.getState().setActivities(Array.isArray(data) ? data : []);
      } catch (err) {
        if (cancelled) return;
        useActivityStore.getState().setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (!cancelled) useActivityStore.getState().setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [boardId, limit]);

  return { activities, loading, error };
}
