"use client";

// CardImplementationNote — the "Note สำหรับ dev" section. Mirrors
// CardDescriptionField (manual save through the modal footer), rendered as
// a paragraph in read view. Hidden when empty + read-only so cards
// without a note stay visually quiet.

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  canEdit: boolean;
}

export function CardImplementationNote({ value, onChange, canEdit }: Props) {
  if (!canEdit && value.trim().length === 0) return null;

  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
        Implementation Note · Note สำหรับ dev
      </label>
      {canEdit ? (
        <textarea
          rows={3}
          value={value}
          onChange={onChange}
          placeholder={`เช่น "ใช้ webhook X", "rate limit Y/min"`}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
        />
      ) : (
        <p className="text-sm text-slate-600 whitespace-pre-wrap">{value}</p>
      )}
    </div>
  );
}
