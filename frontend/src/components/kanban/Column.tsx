import { useDroppable } from '@dnd-kit/core';
import { Card } from '@/store/useBoardStore';
import { KanbanCard } from './Card';

interface ColumnProps {
  id: string;
  title: string;
  cards: Card[];
}

export function KanbanColumn({ id, title, cards }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <div 
      ref={setNodeRef}
      className={`p-4 rounded-xl w-80 min-h-[500px] border transition-colors ${
        isOver ? 'bg-blue-50 border-blue-300' : 'bg-slate-100 border-slate-200'
      }`}
    >
      
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-slate-700 uppercase text-sm tracking-wider">{title}</h3>
        <span className="bg-slate-200 text-slate-600 text-xs px-2 py-1 rounded-full">{cards.length}</span>
      </div>
      
      <div className="space-y-3 flex flex-col min-h-[100px]">
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} />
        ))}
      </div>
    </div>
  );
}