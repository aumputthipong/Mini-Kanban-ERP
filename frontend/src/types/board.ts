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
  subtasks?: Subtask[];
  is_done: boolean;
  completed_at:string |null;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  category: `TODO`|`DONE`;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  budget: number;
}

export interface CreateCardPayload {
  column_id: string;
  title: string;
}

export interface BoardMember {
  id:        string;
  role:      "owner" | "manager" | "member";
  user_id:   string;
  email:     string;
  full_name: string;
}

export interface User {
  id:        string;
  email:     string;
  full_name: string;
}

export interface Subtask {
  id: string;
  card_id: string;
  title: string;
  is_done: boolean;
  position: number;
}