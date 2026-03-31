// types/board.ts
export interface Card {
  id: string;
  column_id: string;
  title: string;
  position: number;
  description: string | null;
  due_date: string | null;
  assignee_id: string | null;
  assignee_name: string | null;
  priority: "low" | "medium" | "high" | null;
  estimated_hours: number | null;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
}

export interface CreateCardPayload {
  column_id: string;
  title: string;
}