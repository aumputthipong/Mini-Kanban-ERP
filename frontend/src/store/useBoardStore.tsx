import { create } from 'zustand';

// 1. กำหนดหน้าตาของข้อมูล (Type) ให้ตรงกับที่เราออกแบบไว้ในฐานข้อมูล Go
export interface Card {
  id: string;
  column_id: string;
  title: string;
  position: number;
}

export interface Column {
  id: string;
  title: string;
  position: number;
  cards: Card[];
}

// 2. กำหนดว่าใน Store นี้จะมีข้อมูลและฟังก์ชันอะไรให้เรียกใช้บ้าง
interface BoardState {
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  moveCard: (cardId: string, fromColumnId: string, toColumnId: string) => void;
  addCardToStore: (newCard: any) => void;
  removeCardFromStore: (cardId: string) => void;
}

// 3. สร้าง Store ด้วย Zustand (ตัวจัดการ State ที่ทำงานเร็วกว่า Redux และตั้งค่าง่ายกว่ามาก)
export const useBoardStore = create<BoardState>((set) => ({
  columns: [], 
  setColumns: (columns) => set({ columns }),
  
  moveCard: (cardId, fromColumnId, toColumnId) => set((state) => {
    if (fromColumnId === toColumnId) return state; // ถ้าวางที่เดิม ไม่ต้องทำอะไร

    // สร้าง Copy ของ State เดิม เพื่อป้องกันการแก้ค่าตรงๆ (Immutability Best Practice)
    const newColumns = [...state.columns];
    
    // หา Index ของคอลัมน์ต้นทางและปลายทาง
    const fromColIndex = newColumns.findIndex(c => c.id === fromColumnId);
    const toColIndex = newColumns.findIndex(c => c.id === toColumnId);

    if (fromColIndex === -1 || toColIndex === -1) return state;

    // หา Index ของการ์ดที่ถูกลาก
    const cardIndex = newColumns[fromColIndex].cards.findIndex(c => c.id === cardId);
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

  addCardToStore: (newCard) => set((state) => ({
    columns: state.columns.map((col) => {
      if (col.id === newCard.column_id) {
        return {
          ...col,
          cards: [...col.cards, newCard], // เอาการ์ดใหม่ไปต่อท้าย list เดิม
        };
      }
      return col;
    }),
  })),

  removeCardFromStore: (cardId) => set((state) => ({
    columns: state.columns.map((col) => ({
      ...col,
      // กรอง (filter) เอาเฉพาะการ์ดที่ ID ไม่ตรงกับตัวที่ถูกลบ ไว้ในคอลัมน์เดิม
      cards: col.cards.filter((card) => card.id !== cardId),
    })),
  })),
}));