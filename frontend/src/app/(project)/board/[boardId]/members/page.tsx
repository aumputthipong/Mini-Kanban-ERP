import { BoardDashboard } from "@/components/board/dashboard/BoardDashboard";
import { BoardMembersSection } from "@/components/board/members/BoardMembersSection";

import { use } from "react";

interface PageProps {
  params: Promise<{ boardId: string }>;
}

export default function OverviewPage({ params }: PageProps) {
  const { boardId } = use(params);
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 ease-in-out">
      {/* ดึง Component Dashboard มาแสดง */}
      <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm">
        <BoardMembersSection boardId={boardId} />
      </div>
    </div>
  );
}
