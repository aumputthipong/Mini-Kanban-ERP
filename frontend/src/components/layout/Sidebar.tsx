// components/layout/Sidebar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Plus } from "lucide-react";

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

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
        >
          <LayoutDashboard size={16} />
          All Boards
        </Link>

        <div className="pt-3">
          <p className="px-3 mb-1 text-xs font-bold text-slate-400 uppercase tracking-wider">
            Boards
          </p>
          {boards.map((board) => {
            const href = `/board/${board.id}`;
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
                <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                <span className="truncate">{board.title}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="p-3 border-t border-slate-100">
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors">
          <Plus size={16} />
          New Board
        </button>
      </div>
    </aside>
  );
}