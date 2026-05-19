// lib/planningApi.ts — thin wrappers around apiClient for the Planning
// endpoints. Keeping these in one file (rather than scattered in components)
// makes it cheap to swap the transport later (e.g. WS sync in Phase 3).
import { apiClient } from "@/lib/apiClient";
import type {
  PlanningSessionSummary,
  PlanningSessionDetail,
  PlanningItem,
  PlanningItemType,
  PlanningItemStatus,
} from "@/types/planning";

export const planningApi = {
  listSessions: (boardId: string) =>
    apiClient<PlanningSessionSummary[]>(
      `/api/boards/${boardId}/planning/sessions`,
    ),

  createSession: (
    boardId: string,
    data: { title: string; label?: string; meeting_at?: string },
  ) =>
    apiClient<PlanningSessionSummary>(
      `/api/boards/${boardId}/planning/sessions`,
      { data },
    ),

  getSession: (sessionId: string) =>
    apiClient<PlanningSessionDetail>(
      `/api/planning/sessions/${sessionId}`,
    ),

  updateSession: (
    sessionId: string,
    data: { title?: string; label?: string | null; meeting_at?: string | null },
  ) =>
    apiClient<PlanningSessionSummary>(
      `/api/planning/sessions/${sessionId}`,
      { method: "PATCH", data },
    ),

  deleteSession: (sessionId: string) =>
    apiClient<null>(`/api/planning/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  createItem: (
    sessionId: string,
    data: { type: PlanningItemType; title: string; description?: string | null },
  ) =>
    apiClient<PlanningItem>(
      `/api/planning/sessions/${sessionId}/items`,
      { data },
    ),

  updateItem: (
    itemId: string,
    data: {
      type?: PlanningItemType;
      title?: string;
      description?: string | null;
      status?: PlanningItemStatus;
      position?: number;
    },
  ) =>
    apiClient<PlanningItem>(`/api/planning/items/${itemId}`, {
      method: "PATCH",
      data,
    }),

  deleteItem: (itemId: string) =>
    apiClient<null>(`/api/planning/items/${itemId}`, { method: "DELETE" }),

  promoteItem: (itemId: string) =>
    apiClient<{ item: PlanningItem; card_id: string }>(
      `/api/planning/items/${itemId}/promote`,
      { method: "POST", data: {} },
    ),
};
