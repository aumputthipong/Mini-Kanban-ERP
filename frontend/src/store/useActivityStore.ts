import { create } from "zustand";
import type { Activity } from "@/types/activity";

interface ActivityState {
  activities: Activity[];
  loading: boolean;
  error: string | null;
  setActivities: (items: Activity[]) => void;
  prependActivity: (item: Activity) => void;
  setLoading: (v: boolean) => void;
  setError: (v: string | null) => void;
  reset: () => void;
}

/**
 * Activity feed for the currently-viewed board. Kept separate from
 * `useBoardStore` because it grows append-only and doesn't need to resync
 * when switching boards — `reset()` is called on every board change.
 *
 * `prependActivity` is what `useWebSocket` calls on `ACTIVITY_CREATED`. It
 * de-duplicates on `id` (broadcast may arrive before the optimistic write
 * resolves) and caps the list at 100 entries — older history reload via
 * `useActivityFeed` paginates.
 */
export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  loading: false,
  error: null,
  setActivities: (items) => set({ activities: items }),
  prependActivity: (item) =>
    set((s) =>
      s.activities.some((a) => a.id === item.id)
        ? s
        : { activities: [item, ...s.activities].slice(0, 100) },
    ),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  reset: () => set({ activities: [], loading: false, error: null }),
}));
