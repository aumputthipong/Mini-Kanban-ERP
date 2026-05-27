import { apiClient } from "@/lib/apiClient";
import type { MyWorkFilter, MyWorkResponse } from "@/types/myWork";

export interface FetchMyWorkOptions {
  filter?: MyWorkFilter;
  includeUnassigned?: boolean;
  signal?: AbortSignal;
}

export function fetchMyWork(opts: FetchMyWorkOptions = {}): Promise<MyWorkResponse> {
  const params = new URLSearchParams();
  if (opts.filter && opts.filter !== "all") params.set("filter", opts.filter);
  if (opts.includeUnassigned) params.set("include_unassigned", "true");
  const qs = params.toString();
  return apiClient<MyWorkResponse>(`/my-tasks${qs ? `?${qs}` : ""}`, {
    signal: opts.signal,
  });
}

export function completeMyTask(cardId: string): Promise<void> {
  return apiClient(`/my-tasks/${cardId}/complete`, { method: "POST" });
}
