import { create } from "zustand";

/**
 * One toast displayed in the top-level `<Toaster>`. `actionLabel` + `onAction`
 * are paired — supply both for an undo-style affordance, neither for a plain
 * notice.
 */
export interface Toast {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Auto-dismiss after this many ms. Pass `0` to keep the toast sticky. */
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  show: (toast: Omit<Toast, "id" | "duration"> & { duration?: number }) => string;
  dismiss: (id: string) => void;
}

/**
 * Global queue for transient UI feedback. Used by `apiClient` for 403 toasts
 * and by board mutations for "Card moved · Undo" affordances.
 *
 * `show()` returns the toast id so the caller can dismiss it programmatically
 * (e.g. cancel a long-running pending toast once the request resolves). The
 * default 5 s auto-dismiss is fine for confirmations; pass `duration: 0` for
 * sticky errors that need explicit user action.
 */
export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: ({ duration = 5000, ...rest }) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((state) => ({ toasts: [...state.toasts, { id, duration, ...rest }] }));
    if (duration > 0) {
      setTimeout(() => {
        set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
      }, duration);
    }
    return id;
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));
