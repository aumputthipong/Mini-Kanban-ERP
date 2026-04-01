// app/(project)/board/[boardId]/settings/page.tsx
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BoardSettingsForm } from "@/components/board/BoardSettingsForm";
import { apiFetch } from "@/lib/api";
import { Board } from "@/types/board";

interface PageProps {
  params: Promise<{ boardId: string }>;
}

export const metadata: Metadata = { title: "Board Settings" };

export default async function BoardSettingsPage({ params }: PageProps) {
  const { boardId } = await params;

 let board: Board | undefined;
try {
  board = await apiFetch<Board>(`/boards/${boardId}`, { cache: "no-store" });
} catch {
  notFound();
}

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <div className="mb-8 pb-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">Board Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage settings and preferences for this board.
        </p>
      </div>
      <BoardSettingsForm boardId={boardId} board={board} />
    
    </div>
  );
}