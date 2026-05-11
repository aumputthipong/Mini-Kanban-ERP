"use client";

interface CardDescriptionFieldProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  canEdit: boolean;
}

export function CardDescriptionField({
  value,
  onChange,
  canEdit,
}: CardDescriptionFieldProps) {
  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
        Description
      </label>
      {canEdit ? (
        <textarea
          rows={4}
          value={value}
          onChange={onChange}
          placeholder="Add a description..."
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
        />
      ) : (
        <p className="text-sm text-slate-600 px-1 min-h-15 whitespace-pre-wrap">
          {value || (
            <span className="text-slate-300 italic">No description</span>
          )}
        </p>
      )}
    </div>
  );
}
