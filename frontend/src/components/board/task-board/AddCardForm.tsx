"use client";

import { useState, useRef, useEffect } from "react";
import { Plus } from "lucide-react";

interface AddCardFormProps {
  onAdd: (title: string) => void;
  defaultOpen?: boolean;
  onDismiss?: () => void;
}

export function AddCardForm({ onAdd, defaultOpen = false, onDismiss }: AddCardFormProps) {
  const [isAdding, setIsAdding] = useState(defaultOpen);
  const [cardTitle, setCardTitle] = useState("");
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (defaultOpen) {
      setIsAdding(true);
      setTimeout(() => addInputRef.current?.focus(), 0);
    }
  }, [defaultOpen]);

  const handleSubmit = () => {
    if (!cardTitle.trim()) return;
    onAdd(cardTitle.trim());
    setCardTitle("");
    if (onDismiss) onDismiss();
    else setIsAdding(false);
  };

  const handleCancel = () => {
    setCardTitle("");
    if (onDismiss) onDismiss();
    else setIsAdding(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
    if (e.key === "Escape") handleCancel();
  };

  if (isAdding) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-2.5 flex flex-col gap-2">
        <input
          ref={addInputRef}
          autoFocus
          type="text"
          placeholder="Card title..."
          value={cardTitle}
          onChange={(e) => setCardTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full text-sm font-medium text-slate-800 placeholder-slate-400 border border-transparent rounded-md px-2 py-1 focus:outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
        />
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleSubmit}
            disabled={!cardTitle.trim()}
            className="flex-1 bg-blue-600 text-white text-xs font-semibold py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add Card
          </button>
          <button
            onClick={handleCancel}
            className="text-xs text-slate-500 hover:text-slate-700 px-2 py-1.5 rounded-md hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => {
        setIsAdding(true);
        setTimeout(() => addInputRef.current?.focus(), 0);
      }}
      className="cursor-pointer w-full flex items-center gap-1.5 px-2 py-1.5 text-sm text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
    >
      <Plus size={16} /> Add card
    </button>
  );
}
