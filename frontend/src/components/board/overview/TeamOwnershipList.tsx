"use client";

import { Users } from "lucide-react";
import type { Card } from "@/types/board";
import { useBoardOwnership } from "@/hooks/useBoardOwnership";
import { MemberOwnershipRow } from "./MemberOwnershipRow";

interface TeamOwnershipListProps {
  onSelectCard: (card: Card) => void;
}

export function TeamOwnershipList({ onSelectCard }: TeamOwnershipListProps) {
  const { columns, members } = useBoardOwnership();

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          <Users size={14} className="text-slate-400" />
          ใครถืออะไรอยู่
        </span>
        <span className="text-[11px] font-semibold text-slate-400">
          {members.length} คน
        </span>
      </div>

      {members.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-400">
          ยังไม่มีสมาชิกในบอร์ดนี้
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                <th className="pb-2 pl-1 pr-3 text-left font-semibold">สมาชิก</th>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className="px-2 pb-2 text-center font-semibold whitespace-nowrap"
                  >
                    {col.title}
                  </th>
                ))}
                <th className="pb-2 pl-3 pr-1 text-right font-semibold">รวม</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <MemberOwnershipRow
                  key={member.userId}
                  member={member}
                  columns={columns}
                  onSelectCard={onSelectCard}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[11px] text-slate-400">
        นับเฉพาะงานที่ยังไม่เสร็จและมีผู้รับผิดชอบ
      </p>
    </div>
  );
}
