import { Card, Column } from "@/types/board";
import { create } from "zustand";

// 2. กำหนดว่าใน Store นี้จะมีข้อมูลและฟังก์ชันอะไรให้เรียกใช้บ้าง
interface BoardState {
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  addCardToStore: (newCard: any) => void;
  removeCardFromStore: (cardId: string) => void;
  updateCard: (updated: Card) => void;
  setSubtasksToCard: (cardId: string, subtasks: any[]) => void;
}

// 3. สร้าง Store ด้วย Zustand (ตัวจัดการ State ที่ทำงานเร็วกว่า Redux และตั้งค่าง่ายกว่ามาก)
export const useBoardStore = create<BoardState>((set) => ({
  columns: [],
  setColumns: (columns) => set({ columns }),

  moveCard: (cardId, fromColumnId, toColumnId) =>
    set((state) => {
      if (fromColumnId === toColumnId) return state; // ถ้าวางที่เดิม ไม่ต้องทำอะไร

      // สร้าง Copy ของ State เดิม เพื่อป้องกันการแก้ค่าตรงๆ (Immutability Best Practice)
      const newColumns = [...state.columns];

      // หา Index ของคอลัมน์ต้นทางและปลายทาง
      const fromColIndex = newColumns.findIndex((c) => c.id === fromColumnId);
      const toColIndex = newColumns.findIndex((c) => c.id === toColumnId);

      if (fromColIndex === -1 || toColIndex === -1) return state;

      // หา Index ของการ์ดที่ถูกลาก
      const cardIndex = newColumns[fromColIndex].cards.findIndex(
        (c) => c.id === cardId,
      );
      if (cardIndex === -1) return state;

      // 1. ดึงการ์ดออกจากคอลัมน์เดิม (splice จะตัดเอาตัวนั้นออกมา)
      const [movedCard] = newColumns[fromColIndex].cards.splice(cardIndex, 1);

      // 2. อัปเดต ID คอลัมน์ของการ์ดให้เป็นอันใหม่
      movedCard.column_id = toColumnId;

      // 3. เอาการ์ดไปต่อท้ายในคอลัมน์ใหม่
      newColumns[toColIndex].cards.push(movedCard);

      // คืนค่า State ใหม่ให้ React เอาไปวาดหน้าจอใหม่
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
}));
