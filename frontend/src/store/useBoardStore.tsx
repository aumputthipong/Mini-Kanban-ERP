import { Card, Column } from "@/types/board";
import { create } from "zustand";

// 2. กำหนดว่าใน Store นี้จะมีข้อมูลและฟังก์ชันอะไรให้เรียกใช้บ้าง
interface BoardState {
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  moveCard: (cardId: string, toColumnId: string, position?: number, isDone?: boolean, completedAt?: string | null) => void;
  addCardToStore: (newCard: any) => void;
  removeCardFromStore: (cardId: string) => void;
  updateCard: (updated: Card) => void;
  setSubtasksToCard: (cardId: string, subtasks: any[]) => void;
  updateSubtaskInCard: (cardId: string, subtaskId: string, updatedData: any) => void;
  deleteSubtaskFromCard: (cardId: string, subtaskId: string) => void;
}

// 3. สร้าง Store ด้วย Zustand (ตัวจัดการ State ที่ทำงานเร็วกว่า Redux และตั้งค่าง่ายกว่ามาก)
export const useBoardStore = create<BoardState>((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns }),

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
      if (completedAt !== undefined) movedCard.completed_at = completedAt ?? null;

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
          card.id === updated.id ? { ...card, ...updated } : card,
        ),
      })),
    })),

    // ✨ [เพิ่มใหม่]: Implementation ของ setSubtasksToCard
  setSubtasksToCard: (cardId, subtasks) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) =>
          // ถ้าเจอการ์ดที่ ID ตรงกัน ให้เอา array ของ subtasks ไปใส่ทับของเดิม
          card.id === cardId ? { ...card, subtasks: subtasks } : card,
        ),
      })),
    })),

    updateSubtaskInCard: (cardId, subtaskId, updatedData) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) => {
          if (card.id === cardId && card.subtasks) {
            return {
              ...card,
              subtasks: card.subtasks.map((st) =>
                // ถ้าเจอ subtask ที่ตรงกัน ให้เอา data ใหม่ไปทับ
                st.id === subtaskId ? { ...st, ...updatedData } : st
              ),
            };
          }
          return card;
        }),
      })),
    })),

  deleteSubtaskFromCard: (cardId, subtaskId) =>
    set((state) => ({
      columns: state.columns.map((col) => ({
        ...col,
        cards: col.cards.map((card) => {
          if (card.id === cardId && card.subtasks) {
            return {
              ...card,
              // กรองเอาตัวที่ถูกลบออกไป
              subtasks: card.subtasks.filter((st) => st.id !== subtaskId),
            };
          }
          return card;
        }),
      })),
    })),

    
}));

