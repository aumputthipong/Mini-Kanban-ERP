"use client";

import Link from "next/link";
// 1. เพิ่ม useParams เพื่อดึง boardId จาก URL
import { usePathname, useParams } from "next/navigation"; 
import { LayoutDashboard, Plus, Settings, Trash2 } from "lucide-react";

interface Board {
  id: string;
  title: string;
}

interface SidebarProps {
  boards: Board[];
}

export function Sidebar({ boards }: SidebarProps) {
  const pathname = usePathname();
  const params = useParams(); // 2. เรียกใช้งาน params
  
  // 3. ดึง boardId ออกมา (ชื่อตัวแปรต้องตรงกับชื่อโฟลเดอร์ [boardId] ของคุณ)
  const currentBoardId = params.boardId as string; 

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Workspace
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link
          href="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/dashboard" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
          }`}
        >
          <LayoutDashboard size={16} />
          All Boards
        </Link>

        {/* 4. แสดงเมนู Setting เฉพาะตอนที่อยู่ในหน้าบอร์ด (มี currentBoardId) */}
        {currentBoardId && (
          <Link
            href={`/board/${currentBoardId}/settings`}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname.includes("/settings") 
                ? "bg-amber-50 text-amber-700" 
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Settings size={16} />
            Board Settings
          </Link>
        )}

        <div className="pt-3">
          <p className="px-3 mb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Your Boards
          </p>
          {boards.map((board) => {
            const href = `/board/${board.id}`;
            // เช็ค isActive ให้แม่นยำขึ้นโดยไม่รวม path settings
            const isActive = pathname === href; 
            
            return (
              <Link
                key={board.id}
                href={href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`} />
                <span className="truncate">{board.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-100 space-y-1">
        <Link
          href="/trash"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            pathname === "/trash" ? "bg-red-50 text-red-700" : "text-slate-600 hover:bg-red-50 hover:text-red-700"
          }`}
        >
          <Trash2 size={16} />
          Trash
        </Link>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors">
          <Plus size={16} />
          New Board
        </button>
      </div>
    </aside>
  );
}