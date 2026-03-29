import { useDroppable } from '@dnd-kit/core';

import { KanbanCard } from './Card';
import { MoreHorizontal, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { Card } from '@/types/board';

interface AddCardForm {
  title: string;
  due_date: string;
   assignee_id: string;

}

interface ColumnProps {
  id: string;
  title: string;
  cards: Card[];
  onAddCard: (columnId: string, form: AddCardForm) => void;
  onDeleteCard: (cardId: string) => void;
}
export function KanbanColumn({ id, title, cards, onAddCard, onDeleteCard }: ColumnProps) {

    const { setNodeRef, isOver } = useDroppable({ id });
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState<AddCardForm>({
    title: "",
    due_date: "",
    assignee_id: "",
  });

const handleSubmit = () => {
  if (!form.title.trim()) return;
  onAddCard(id, form);
  // ขาดสองบรรทัดนี้
  setForm({ title: "", due_date: "",assignee_id: "", });
  setIsAdding(false);
};
const handleCancel = () => {
  setForm({ title: "", due_date: "", assignee_id: "" });
  setIsAdding(false);
};
  return (
 <div
      ref={setNodeRef}
      className={`w-72 shrink-0 rounded-2xl p-4 flex flex-col gap-3 transition-colors
        ${isOver ? "bg-blue-50 border-2 border-blue-300" : "bg-slate-100 border-2 border-transparent"}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-slate-700">{title}</h2>
        <span className="text-xs font-semibold text-slate-400 bg-slate-200 px-2 py-0.5 rounded-full">
          {cards.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {cards.map((card) => (
          <KanbanCard key={card.id} card={card} onDelete={onDeleteCard} />
        ))}
      </div>

      {isAdding ? (
        <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-2">
          <input
            autoFocus
            type="text"
            placeholder="Card title"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
          />
          <input
            type="date"
            value={form.due_date}
            onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 text-slate-500"
          />
         <input
            type="text"
            placeholder="Assignee ID (optional)"
            value={form.assignee_id}
            onChange={(e) => setForm((f) => ({ ...f, assignee_id: e.target.value }))}
            className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 bg-blue-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Card
            </button>
            <button
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 p-2"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-200 rounded-xl px-3 py-2 transition-colors"
        >
          <Plus size={16} />
          Add card
        </button>
      )}
    </div>
  );
}