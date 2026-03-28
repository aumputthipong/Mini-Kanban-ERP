import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/store/useBoardStore';
import { KanbanCard } from './Card';
import { MoreHorizontal, Plus } from 'lucide-react';

interface ColumnProps {
  id: string;
  title: string;
  cards: Card[];
  onDeleteCard: (cardId: string, cardTitle: string) => void; 
  onAddCard: () => void;
}

export function KanbanColumn({ id, title, cards, onDeleteCard, onAddCard }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    
  });
  

  return (
    <div 
      ref={setNodeRef}
      className={`p-4 rounded-2xl w-80 min-h-[500px] flex flex-col gap-4 transition-colors ${
        isOver ? 'bg-slate-200' : 'bg-[#f4f5f8]' // สีพื้นหลังอิงตามภาพอ้างอิง
      }`}
    >
      {/* Header ของคอลัมน์ */}
      <div className="flex justify-between items-center px-1">
        <h3 className="font-semibold text-slate-800">{title}</h3>
        
        <div className="flex items-center gap-1 text-slate-500">
          <button 
            onClick={onAddCard}
            className="p-1 hover:bg-slate-200 hover:text-slate-800 rounded-md transition-colors"
          >
            <Plus size={18} />
          </button>
          <button className="p-1 hover:bg-slate-200 hover:text-slate-800 rounded-md transition-colors">
            <MoreHorizontal size={18} />
          </button>
        </div>
      </div>
      
      {/* พื้นที่ใส่การ์ด */}
      <div className="space-y-3 flex flex-col flex-1">
        {(cards || []).map((card) => (
          <KanbanCard 
            key={card.id} 
            card={card} 
            onDelete={() => onDeleteCard(card.id, card.title)}
          />
        ))}
      </div>
    </div>
  );
}