"use client";

import { use } from "react";
import { useBoardData } from "@/hooks/useBoardData";
import { BoardHeader } from "@/components/board/task-board/BoardHeader";
import { BoardBackground } from "@/components/board/task-board/BoardBackground";
import { BoardWebSocketProvider } from "@/contexts/BoardWebSocketContext";

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
      <main className="min-h-screen bg-[#fafafa] px-8 py-6">
        {/* Header skeleton */}
        <div className="h-14 bg-white rounded-xl border border-slate-200 mb-6 w-full animate-pulse" />
        {/* Toolbar skeleton */}
        <div className="h-12 bg-slate-50 border border-slate-200 rounded-xl mb-6 animate-pulse" />
        {/* Kanban columns skeleton */}
        <div className="flex gap-6 items-start">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-72 shrink-0 rounded-2xl bg-slate-100 p-4 animate-pulse">
              <div className="h-5 bg-slate-200 rounded-lg w-24 mb-4" />
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-24 bg-white rounded-xl border border-slate-200 mb-2" />
              ))}
            </div>
          ))}
        </div>
      </main>
    );
  }

  if (error === "NOT_FOUND") {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-700">Board not found</h1>
        <p className="text-sm text-slate-500 max-w-md">
          ไม่พบบอร์ดนี้ หรือคุณไม่ได้เป็น member ของบอร์ดนี้ — ติดต่อ owner เพื่อขอเชิญเข้าร่วม
        </p>
        <a
          href="/dashboard"
          className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
        >
          ← Back to dashboard
        </a>
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
    <BoardWebSocketProvider boardId={boardId}>
      <div className="relative h-full flex flex-col bg-[#fafafa]">
        <BoardBackground />

        <div className="relative z-10 flex flex-col h-full min-h-0">
          <BoardHeader title="Project Board" />

          <div className="flex-1 min-h-0 overflow-auto px-8 pb-8">
            {children}
          </div>
        </div>
      </div>
    </BoardWebSocketProvider>
  );
}