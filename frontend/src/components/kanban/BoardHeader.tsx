"use client";

import { Kanban, List, CalendarDays, LayoutTemplate, Plus, Filter, LayoutGrid } from "lucide-react";
import { useState } from "react";

// กำหนด Props
interface BoardHeaderProps {
  title?: string;
}

export function BoardHeader({ title = "Mini ERP Kanban" }: BoardHeaderProps) {
  // State จำลองสำหรับการสลับ View (เพื่อให้มี UI เปลี่ยนสีได้)
  const [activeView, setActiveView] = useState("Board");

  return (
    <header className="bg-white border-b border-slate-200 w-full mb-6 z-10 relative">
      
      {/* ----------------- ชั้นบน (Top Row) ----------------- */}
      <div className="flex items-center gap-6 px-6 pt-4">
        
        {/* ชื่อโปรเจกต์ (ย่อให้เล็กลง ไม่มีคำอธิบาย) */}
        <div className="flex items-center gap-2 pr-6 border-r border-slate-200">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <LayoutGrid size={16} />
          </div>
          <h1 className="text-xl font-bold text-slate-800 tracking-tight">
            {title}
          </h1>
        </div>

        {/* แถบเมนูโหมดการดู (Views Navigation) */}
        <div className="flex items-center gap-1">
          {/* Overview */}
          <button 
            onClick={() => setActiveView("Overview")}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === "Overview" 
                ? "border-indigo-600 text-indigo-700" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <LayoutTemplate size={16} />
            Overview
          </button>

          {/* List */}
          <button 
            onClick={() => setActiveView("List")}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === "List" 
                ? "border-indigo-600 text-indigo-700" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <List size={16} />
            List
          </button>

          {/* Board (Kanban) - ค่าเริ่มต้น */}
          <button 
            onClick={() => setActiveView("Board")}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === "Board" 
                ? "border-indigo-600 text-indigo-700" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <Kanban size={16} />
            Board
          </button>

          {/* Calendar */}
          <button 
            onClick={() => setActiveView("Calendar")}
            className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeView === "Calendar" 
                ? "border-indigo-600 text-indigo-700" 
                : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
            }`}
          >
            <CalendarDays size={16} />
            Calendar
          </button>

          {/* เส้นคั่น */}
          <div className="w-px h-5 bg-slate-200 mx-2"></div>

          {/* ปุ่มเพิ่ม View ใหม่ */}
          <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors">
            <Plus size={16} />
            View
          </button>
        </div>

      </div>

      {/* ----------------- ชั้นล่าง (Bottom Row / Toolbar) ----------------- */}
      <div className="flex items-center gap-3 px-6 py-3 border-t border-slate-100 bg-slate-50/50">
        
        {/* ปุ่ม Filters ตามที่คุณต้องการก่อนอันดับแรก */}
        <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm">
          <Filter size={14} />
          Filters
        </button>

        {/* สามารถเพิ่มปุ่ม Group, Sort อื่นๆ ตรงนี้ในอนาคตได้ */}
        
      </div>
    </header>
  );
}