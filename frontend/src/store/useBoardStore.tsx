import { BoardMember, Card, Column } from "@/types/board";
import { create } from "zustand";

interface BoardState {
  columns: Column[];
  currentUserId: string;
  boardMembers: BoardMember[];
  isLoading: boolean;
  setColumns: (columns: Column[]) => void;
  setCurrentUser: (userId: string) => void;
  setBoardMembers: (members: BoardMember[]) => void;
  setLoading: (v: boolean) => void;
  moveCard: (
    cardId: string,
    toColumnId: string,
    position?: number,
    isDone?: boolean,
    completedAt?: string | null,
  ) => void;
  addCardToStore: (newCard: any) => void;
  removeCardFromStore: (cardId: string) => void;
  updateCard: (updated: Card) => void;
  setSubtasksToCard: (cardId: string, subtasks: any[]) => void;
  updateSubtaskInCard: (
    cardId: string,
    subtaskId: string,
    updatedData: any,
  ) => void;
  deleteSubtaskFromCard: (cardId: string, subtaskId: string) => void;
}

// 3. สร้าง Store ด้วย Zustand (ตัวจัดการ State ที่ทำงานเร็วกว่า Redux และตั้งค่าง่ายกว่ามาก)
export const useBoardStore = create<BoardState>((set) => ({
  columns: [],
  currentUserId: "",
  boardMembers: [],
  isLoading: false,
  setColumns: (columns) => set({ columns }),
  setCurrentUser: (userId) => set({ currentUserId: userId }),
  setBoardMembers: (members) => set({ boardMembers: members }),
  setLoading: (v) => set({ isLoading: v }),

  moveCard: (cardId, toColumnId, _position, isDone, completedAt) =>
    set((state) => {
      const newColumns = state.columns.map((col) => ({
        ...col,
        cards: [...col.cards],
      }));

      // ค้นหา card จากทุก column
      let fromColIndex = -1;
      let cardIndex = -1;
      for (let i = 0; i < newColumns.length; i++) {
        const idx = newColumns[i].cards.findIndex((c) => c.id === cardId);
        if (idx !== -1) {
          fromColIndex = i;
          cardIndex = idx;
          break;
        }
      }

      if (fromColIndex === -1) return state;

      const toColIndex = newColumns.findIndex((c) => c.id === toColumnId);
      if (toColIndex === -1) return state;

      // ดึงการ์ดออกจาก column เดิม
      const [movedCard] = newColumns[fromColIndex].cards.splice(cardIndex, 1);

      // อัปเดต fields
      movedCard.column_id = toColumnId;
      if (isDone !== undefined) movedCard.is_done = isDone;
      if (completedAt !== undefined)
        movedCard.completed_at = completedAt ?? null;

      // เอาการ์ดไปต่อท้ายใน column ใหม่
      newColumns[toColIndex].cards.push(movedCard);

      return { columns: newColumns };
    }),

  addCardToStore: (newCard) =>
    set((state) => {
      // 1. ตรวจสอบก่อนว่า ID นี้มีอยู่ในการ์ดใบไหนในทุก Column หรือยัง?
      // ใช้ .some() เพื่อความรวดเร็วในการเช็ก
      const isAlreadyExists = state.columns.some((col) =>
        col.cards.some((card) => card.id === newCard.id),
      );

      // 2. ถ้ามี ID นี้อยู่แล้ว ให้คืนค่า state เดิมกลับไป (ไม่ต้องอัปเดต)
      if (isAlreadyExists) {
        return state;
      }

      // 3. ถ้ายังไม่มี (เป็นเคสที่คนอื่นสร้าง หรือเราเพิ่งได้รับครั้งแรก) ค่อยเพิ่มเข้าไป
      return {
        columns: state.columns.map((col) => {
          if (col.id === newCard.column_id) {
            return {
              ...col,
              cards: [...col.cards, newCard],
            };
          }
          return col;
        }),
      };
    }),
  removeCardFromStore: (cardId) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        // กรอง (filter) เอาเฉพาะการ์ดที่ ID ไม่ตรงกับตัวที่ถูกลบ ไว้ในคอลัมน์เดิม
        cards: col.cards.filter((card) => card.id !== cardId),
      })),
    })),

  updateCard: (updated) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === updated.id
            ? {
                ...card,
                ...updated,
                total_subtasks: updated.total_subtasks ?? card.total_subtasks,
                completed_subtasks:
                  updated.completed_subtasks ?? card.completed_subtasks,
                subtasks: updated.subtasks ?? card.subtasks,
              }
            : card,
        ),
      })),
    })),

  // ✨ [เพิ่มใหม่]: Implementation ของ setSubtasksToCard
  setSubtasksToCard: (cardId, subtasks) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          card.id === cardId
            ? {
                ...card,
                subtasks,
                total_subtasks: subtasks.length,
                completed_subtasks: subtasks.filter((st: any) => st.is_done).length,
              }
            : card,
        ),
      })),
    })),

  updateSubtaskInCard: (cardId, subtaskId, updatedData) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) => {
          if (card.id !== cardId) return card;
          const newSubtasks = card.subtasks
            ? card.subtasks.map((st) =>
                st.id === subtaskId ? { ...st, ...updatedData } : st,
              )
            : card.subtasks;
          // อัปเดต completed_subtasks count ถ้ามีการเปลี่ยน is_done
          let completedDelta = 0;
          if (updatedData.is_done !== undefined && card.subtasks) {
            const old = card.subtasks.find((st) => st.id === subtaskId);
            if (old && old.is_done !== updatedData.is_done) {
              completedDelta = updatedData.is_done ? 1 : -1;
            }
          }
          return {
            ...card,
            subtasks: newSubtasks,
            completed_subtasks: card.completed_subtasks + completedDelta,
          };
        }),
      })),
    })),

  deleteSubtaskFromCard: (cardId, subtaskId) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) => {
          if (card.id !== cardId || !card.subtasks) return card;
          const removed = card.subtasks.find((st) => st.id === subtaskId);
          return {
            ...card,
            subtasks: card.subtasks.filter((st) => st.id !== subtaskId),
            total_subtasks: card.total_subtasks - 1,
            completed_subtasks:
              card.completed_subtasks - (removed?.is_done ? 1 : 0),
          };
        }),
      })),
    })),
}));
