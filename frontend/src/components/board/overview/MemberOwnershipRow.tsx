"use client";

import { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import type { Card } from "@/types/board";
import type { MemberOwnership, OwnershipColumn } from "@/hooks/useBoardOwnership";
import { avatarColor, initials } from "./activityFormat";
import { HeldCardRow } from "./HeldCardRow";

interface MemberOwnershipRowProps {
  member: MemberOwnership;
  columns: OwnershipColumn[];
  onSelectCard: (card: Card) => void;
}

export function MemberOwnershipRow({ member, columns, onSelectCard }: MemberOwnershipRowProps) {
  const idle = member.totalHeld === 0;
  const [expanded, setExpanded] = useState(false);

  const columnTitleById = useMemo(
    () => new Map(columns.map((c) => [c.id, c.title])),
    [columns],
  );

  return (
    <>
      <tr
        className={`border-t border-slate-100 transition-colors ${
          idle ? "" : "cursor-pointer hover:bg-slate-50/70"
        }`}
        onClick={idle ? undefined : () => setExpanded((v) => !v)}
        aria-expanded={idle ? undefined : expanded}
      >
        {/* member */}
        <td className="py-2.5 pl-1 pr-3">
          <div className="flex items-center gap-2">
            <ChevronRight
              size={15}
              className={`shrink-0 text-slate-300 transition-transform ${
                idle ? "invisible" : ""
              } ${expanded ? "rotate-90" : ""}`}
            />
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ${avatarColor(member.name)}`}
            >
              {initials(member.name)}
            </span>
            <span className="truncate text-sm font-semibold text-slate-900">
              {member.name}
            </span>
          </div>
        </td>

        {/* per-column counts */}
        {columns.map((col) => {
          const count = member.countByColumn[col.id] ?? 0;
          return (
            <td key={col.id} className="px-2 py-2.5 text-center">
              {count === 0 ? (
                <span className="text-slate-300">·</span>
              ) : (
                <span className="text-sm font-semibold tabular-nums text-slate-700">
                  {count}
                </span>
              )}
            </td>
          );
        })}

        {/* total */}
        <td className="py-2.5 pl-3 pr-1 text-right">
          {idle ? (
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
              ว่าง
            </span>
          ) : (
            <span className="text-sm font-bold tabular-nums text-slate-900">
              {member.totalHeld}
              <span className="ml-1 text-[11px] font-semibold text-slate-400">อัน</span>
            </span>
          )}
        </td>
      </tr>

      {expanded && !idle && (
        <tr className="border-t border-slate-100 bg-slate-50/50">
          <td colSpan={columns.length + 2} className="px-2 py-1.5 pl-8">
            <div className="flex flex-col">
              {member.cards.map((card) => (
                <HeldCardRow
                  key={card.id}
                  card={card}
                  columnTitle={columnTitleById.get(card.column_id) ?? ""}
                  onSelect={onSelectCard}
                />
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
