"use client";

import { Kanban, CalendarDays, LayoutTemplate, Filter, LayoutGrid } from "lucide-react";

// 1. กำหนด Type สำหรับ View เพื่อป้องกันการพิมพ์ผิด
export type ViewType = "Overview" | "Board" | "Calendar";

interface BoardHeaderProps {
  title?: string;
  activeView: ViewType;
  onViewChange: (view: ViewType) => void;
}

export function BoardHeader({ title = "Mini ERP Kanban", activeView, onViewChange }: BoardHeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 w-full mb-6 z-10 relative">
      
      {/* ----------------- ชั้นบน (Top Row) ----------------- */}
      <div className="flex items-center px-6 pt-4 pb-2 ">
      
      {/* ชื่อโปรเจกต์ */}
      <div className="flex items-center gap-2 pr-6 border-r border-slate-200">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
        <LayoutGrid size={16} />
        </div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
        {title}
        </h1>
      </div>

      {/* แถบเมนูโหมดการดู (Views Navigation) */}
      <div className="flex items-center gap-1 pl-6">
        {/* Overview (จะโยงไปหน้า Dashboard) */}
        <button 
        onClick={() => onViewChange("Overview")}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeView === "Overview" 
          ? "border-indigo-600 text-indigo-700" 
          : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
        }`}
        >
        <LayoutTemplate size={16} />
        Overview
        </button>

        {/* Board (Kanban) */}
        <button 
        onClick={() => onViewChange("Board")}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeView === "Board" 
          ? "border-indigo-600 text-indigo-700" 
          : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
        }`}
        >
        <Kanban size={16} />
        Board
        </button>

        {/* Calendar (เตรียมไว้สำหรับอนาคต) */}
        <button 
        onClick={() => onViewChange("Calendar")}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
          activeView === "Calendar" 
          ? "border-indigo-600 text-indigo-700" 
          : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
        }`}
        >
        <CalendarDays size={16} />
        Calendar
        </button>
      </div>

      </div>

      {/* ----------------- ชั้นล่าง (Bottom Row / Toolbar) ----------------- */}
      {activeView === "Board" && (<div className="flex items-center gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50/50 mt-1">
      <button className="flex items-center gap-2 px-3 pb-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
        <Filter size={14} />
        Filters
      </button>
      </div>)}
    </header>
  );
}