// types/board.ts
export interface Tag {
  id: string;
  board_id: string;
  name: string;
  color: string;
}

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
  is_done: boolean;
  completed_at: string | null;
  created_at: string | null;
  created_by: string | null;
  total_subtasks: number;      // เพิ่ม — มาจาก COUNT
  completed_subtasks: number;      // เพิ่ม — มาจาก COUNT
  subtasks?: Subtask[];
  tags?: Tag[];
}

export interface Column {
  id: string;
  title: string;
  position: number;
  category: "TODO" | "DONE";
  color?: string | null;
  cards: Card[];
}

export interface Board {
  id: string;
  title: string;
  budget?: number;
  updated_at: string;
  total_cards: number;
  done_cards: number;
  members: { user_id: string; full_name: string }[];
}

export interface CreateCardPayload {
  column_id: string;
  title: string;
}

export interface BoardMember {
  id: string;
  role: "owner" | "manager" | "member";
  user_id: string;
  email: string;
  full_name: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
}

export interface Subtask {
  id: string;
  card_id: string;
  title: string;
  is_done: boolean;
  position: number;
}

export interface CardUpdateForm {
  title: string;
  description: string;
  due_date: string;
  assignee_id: string;
  priority: string;
  estimated_hours: string;
  tags: Tag[];
}