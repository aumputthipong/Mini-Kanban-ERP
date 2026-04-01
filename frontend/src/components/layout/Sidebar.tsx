"use client";

import Link from "next/link";
import { usePathname } from "next/navigation"; 
import { LayoutDashboard, Plus, Trash2, CheckSquare, Users } from "lucide-react";

interface Board {
  id: string;
  title: string;
}

interface SidebarProps {
  boards: Board[];
}

export function Sidebar({ boards }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col h-full">
      <div className="p-4 border-b border-slate-100">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Workspace
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-4">
        
        {/* 1. เมนูส่วนกลาง (Global Views) */}
        <div className="space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/dashboard" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <LayoutDashboard size={16} />
            All Boards
          </Link>

          {/* ไอเดียเมนูเพิ่มเติมสำหรับ ERP/Kanban */}
          <Link
            href="/my-tasks"
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              pathname === "/my-tasks" ? "bg-slate-100 text-slate-900" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <CheckSquare size={16} />
            My Tasks
          </Link>

      
        </div>

        {/* 2. รายชื่อบอร์ด (Your Projects) */}
        <div className="pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Your Projects
            </p>
            <button className="text-slate-400 hover:text-slate-700 transition-colors p-1" title="Create Board">
              <Plus size={14} />
            </button>
          </div>
          
          <div className="space-y-1">
            {boards.map((board) => {
              const href = `/board/${board.id}`;
              // เช็ค isActive แค่ถ้า pathname เริ่มต้นด้วย URL บอร์ดนั้น (ครอบคลุมทั้งหน้า overview, settings)
              const isActive = pathname.startsWith(href); 
              
              return (
                <Link
                  key={board.id}
                  href={href}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors group ${
                    isActive
                      ? "bg-blue-50 text-blue-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-blue-600' : 'bg-slate-300 group-hover:bg-slate-400'}`} />
                  <span className="truncate">{board.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* 3. ส่วนล่าง (Footer) */}
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
      </div>
    </aside>
  );
}