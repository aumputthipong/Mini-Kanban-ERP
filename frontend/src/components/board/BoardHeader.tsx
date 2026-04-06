"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import {
  Kanban,
  CalendarDays,
  LayoutTemplate,
  Filter,
  LayoutGrid,
  Settings,
  User,
} from "lucide-react";

interface BoardHeaderProps {
  title?: string;
}

export function BoardHeader({ title = "Project Board" }: BoardHeaderProps) {
  const pathname = usePathname();
  const params = useParams();
  const boardId = params.boardId as string;

  // Base URL สำหรับบอร์ดนี้
  const basePath = `/board/${boardId}`;

  return (
    <header className="bg-white border-b border-slate-200 w-full mb-6 z-10 relative">
      <div className="flex items-center justify-between px-6 pt-4">
        {/* ฝั่งซ้าย: โลโก้ + Tabs */}
        <div className="flex items-center">
          <div className="flex items-center gap-2 pr-6 border-r border-slate-200">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <LayoutGrid size={16} />
            </div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">
              {title}
            </h1>
          </div>

          <nav className="flex items-center gap-1 pl-6">
            <Link
              href={`${basePath}/overview`}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                pathname.includes("/overview")
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <LayoutTemplate size={16} />
              Overview
            </Link>

            <Link
              href={`${basePath}/tasks`}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                pathname.includes("/tasks")
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Kanban size={16} />
              Board
            </Link>
            <Link
              href={`${basePath}/members`}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                pathname.includes("/members")
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <User size={16} />
              Members
            </Link>
            {/* Calendar (ยังกดไม่ได้ ให้แสดงเป็นสีเทา) */}
             <Link
              href={`${basePath}/calendar`}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                pathname.includes("/calendar")
                  ? "border-indigo-600 text-indigo-700"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <CalendarDays size={16} />
              Calendar
            </Link>
          </nav>
        </div>

        {/* ฝั่งขวา: Settings (ย้ายมาจาก Sidebar) */}
        <div className="flex items-center">
          <Link
            href={`${basePath}/settings`}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              pathname.includes("/settings")
                ? "border-amber-500 text-amber-600"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Settings size={16} />
            Settings
          </Link>
        </div>
      </div>
      {pathname === `${basePath}/tasks` ? (
        <div className="flex items-center gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50/50 mt-1">
          <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
            <Filter size={14} />
            Filters
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-6 py-6 border-t border-slate-100 bg-slate-50/50 mt-1" />
      )}
    </header>
  );
}
