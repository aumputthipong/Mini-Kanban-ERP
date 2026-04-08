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
      <main className="min-h-screen bg-[#fafafa] px-8 py-6 animate-pulse">
        {/* Header skeleton */}
        <div className="h-14 bg-white rounded-xl border border-slate-200 mb-6 w-full" />
        {/* Content skeleton */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col gap-5">
          <div className="h-28 bg-slate-100 rounded-xl" />
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-100 rounded-xl" />
            ))}
          </div>
          <div className="h-20 bg-slate-100 rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-56 bg-slate-100 rounded-xl" />
            <div className="h-56 bg-slate-100 rounded-xl" />
          </div>
        </div>
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
    <main className="relative h-screen overflow-hidden bg-[#fafafa] flex flex-col">
      <BoardBackground />

      <div className="relative z-10 flex flex-col h-full min-h-0">
        <BoardHeader title="Project Board" />

        <div className="flex-1 min-h-0 overflow-hidden px-8 pb-8">
          {children}
        </div>
      </div>
    </main>
  );
}