"use client";

// CardAcceptanceCriteria — the "เสร็จเมื่อ..." section in the card detail
// modal. Editing mirrors CardDescriptionField (textarea + manual save via
// the modal's footer). Read view renders each non-empty newline-separated
// row as a bulleted list so the AC reads as a checklist, not a paragraph.
//
// Hidden when there's nothing to show AND the user can't edit — keeps
// non-promoted, non-AC cards visually clean.

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  canEdit: boolean;
}

export function CardAcceptanceCriteria({ value, onChange, canEdit }: Props) {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (!canEdit && lines.length === 0) return null;

  return (
    <div>
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
        Acceptance Criteria · เสร็จเมื่อ
      </label>
      {canEdit ? (
        <textarea
          rows={3}
          value={value}
          onChange={onChange}
          placeholder={`เช่น "login ด้วย email ได้" (บรรทัดละข้อ)`}
          className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-y"
        />
      ) : lines.length > 0 ? (
        <ul className="text-sm text-slate-700 list-disc ml-5 space-y-0.5">
          {lines.map((line, i) => (
            <li key={i}>{line}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
