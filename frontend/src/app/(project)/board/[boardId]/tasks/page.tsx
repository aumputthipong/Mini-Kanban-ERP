"use client";

import { use } from "react";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { Filter } from "lucide-react";

interface PageProps {
  params: Promise<{ boardId: string }>;
}

export default function KanbanPage({ params }: PageProps) {
  const { boardId } = use(params);

  // ไม่ต้อง fetch ข้อมูล ไม่ต้องคุม state โยนหน้าที่ให้ KanbanBoard ลุยเลย!
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <KanbanBoard boardId={boardId} />
    </div>
  );
}