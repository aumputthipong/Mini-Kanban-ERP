"use client";

import { use, useState } from "react";
import { useBoardData } from "@/hooks/useBoardData";
import { BoardHeader, ViewType } from "@/components/board/BoardHeader";
import { KanbanBoard } from "@/components/board/KanbanBoard";
import { BoardBackground } from "@/components/board/BoardBackground";
import { BoardDashboard } from "@/components/board/dashboard/BoardDashboard";
import { CalendarDays } from "lucide-react";

interface PageProps {
  params: Promise<{ boardId: string }>;
}

export default function KanbanPage({ params }: PageProps) {
  const { boardId } = use(params);
  const { isLoading, error } = useBoardData(boardId);
  
  // สร้าง State สำหรับควบคุม Tab ปัจจุบัน โดยตั้งค่าเริ่มต้นให้เป็น Board
  const [activeView, setActiveView] = useState<ViewType>("Board");

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
    // เอา padding (p-8) ออกจาก main เพื่อให้ BoardHeader กินพื้นที่เต็มความกว้าง
    <main className="relative min-h-screen bg-[#fafafa]">
      <BoardBackground />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* ส่ง State และ Setter ลงไปให้ BoardHeader จัดการเรื่อง UI และ Event */}
        <BoardHeader 
          title="Project Board" 
          activeView={activeView}
          onViewChange={setActiveView}
        />

        {/* พื้นที่สำหรับแสดงเนื้อหาตาม Tab ที่เลือก (ใส่ padding ไว้ตรงนี้แทน) */}
        <div className="flex-1 px-8 pb-8">
          
          {/* แสดงหน้า Dashboard เมื่อกดปุ่ม Overview */}
          {activeView === "Overview" && (
            <BoardDashboard />
          )}

          {/* แสดงหน้า Kanban เมื่อกดปุ่ม Board */}
          {activeView === "Board" && (
            <KanbanBoard boardId={boardId} />
          )}

          {/* พื้นที่ว่างสำหรับ Calendar ในอนาคต */}
          {activeView === "Calendar" && (
            <div className="flex items-center justify-center h-[50vh] text-slate-400 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
              <div className="flex flex-col items-center gap-2">
                <CalendarDays size={32} className="text-slate-300" />
                <p>Calendar View (Coming Soon)</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}