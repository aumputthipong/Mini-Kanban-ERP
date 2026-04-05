"use client";

import { use } from "react";
import { useBoardData } from "@/hooks/useBoardData";
import { BoardHeader } from "@/components/board/BoardHeader";
import { BoardBackground } from "@/components/board/BoardBackground";

interface BoardLayoutProps {
  children: React.ReactNode;
  params: Promise<{ boardId: string }>;
}

export default function BoardLayout({ children, params }: BoardLayoutProps) {
  const { boardId } = use(params);
  const { isLoading, error } = useBoardData(boardId);

  // จัดการสถานะ Loading ระดับ Layout
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
    <main className="relative min-h-screen bg-[#fafafa]">
      <BoardBackground />
      
      <div className="relative z-10 flex flex-col h-full">
        <BoardHeader title="Project Board" />
        
        <div className="flex-1 px-8 pb-8 pt-2">
          {children}
        </div>
      </div>
    </main>
  );
}