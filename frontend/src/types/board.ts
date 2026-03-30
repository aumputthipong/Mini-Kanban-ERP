// types/board.ts
export interface Card {
  id: string;
  column_id: string;
  title: string;
  description?: string;
  due_date?: string | null;
  assignee?: string | null;
  avatar_url?: string | null; 
  priority?: "low" | "medium" | "high";
  estimated_hours?: number; 
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
  due_date?: string;
  assignee?: string;
}