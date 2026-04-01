// app/(project)/board/[boardId]/page.tsx
"use client";

import { use } from "react";
import { useBoardData } from "@/hooks/useBoardData";
import { BoardHeader } from "@/components/board/BoardHeader";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { BoardBackground } from "@/components/board/BoardBackground";

interface PageProps {
  params: Promise<{ boardId: string }>;
}

export default function KanbanPage({ params }: PageProps) {
  const { boardId } = use(params);
  
  // เรียกใช้ Hook ที่เราแยกออกไป
  const { isLoading, error } = useBoardData(boardId);

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500">Loading board...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-red-500">{error}</p>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-[#fafafa] p-8">
      <BoardBackground />
      
      <div className="relative z-10">
        <BoardHeader title="Project Board" />
        <KanbanBoard boardId={boardId} />
      </div>
    </main>
  );
}