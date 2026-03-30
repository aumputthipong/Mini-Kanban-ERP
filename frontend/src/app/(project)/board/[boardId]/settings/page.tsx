// app/(project)/board/[boardId]/settings/page.tsx

import { API_URL } from "@/lib/constants";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { BoardSettingsForm } from "@/components/kanban/BoardSettingsForm";

interface PageProps {
  params: Promise<{ boardId: string }>;
}

export const metadata: Metadata = { title: "Board Settings" };

async function getBoard(boardId: string) {
  try {
    const res = await fetch(`${API_URL}/boards/${boardId}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function BoardSettingsPage({ params }: PageProps) {
  const { boardId } = await params;
  const board = await getBoard(boardId);

  if (!board) notFound();

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