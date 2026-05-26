// types/planning.ts
//
// Planning section mirrors backend dto.PlanningSessionSummary / Detail /
// PlanningItemResponse. The three item types (REQ / DEC / Q) reflect the
// three questions any session answers: what we want, what we've decided,
// what we still don't know. "DROP" is a *status* on an item, not a fourth
// type — see backend/internal/service/planning_service.go for the rationale.

export type PlanningItemType = "REQ" | "DEC" | "Q";
export type PlanningItemStatus = "live" | "selected" | "dropped" | "promoted";

export interface PlanningSessionSummary {
  id: string;
  board_id: string;
  title: string;
  label: string | null;
  meeting_at: string | null;
  created_at: string;
  updated_at: string;
  req_count: number;
  dec_count: number;
  q_count: number;
  promoted_count: number;
  dropped_count: number;
}

export interface PlanningItem {
  id: string;
  session_id: string;
  type: PlanningItemType;
  title: string;
  description: string | null;
  status: PlanningItemStatus;
  promoted_to_card_id: string | null;
  position: number;
  created_at: string;
}

export interface PlanningSessionDetail {
  id: string;
  board_id: string;
  title: string;
  label: string | null;
  meeting_at: string | null;
  created_at: string;
  updated_at: string;
  items: PlanningItem[];
}

// Returned by GET /cards/:cardID/source. The handler responds with `null`
// (not 404) when a card wasn't promoted from planning, so the modal can
// render its "ที่มา" section conditionally without an error fork.
export interface CardSource {
  session: {
    id: string;
    title: string;
    label: string | null;
    meeting_at: string | null;
  };
  item: {
    id: string;
    type: PlanningItemType;
    title: string;
    status: PlanningItemStatus;
  };
  pending_questions: { id: string; title: string }[];
}
