"use client";

import { Kanban, DollarSign, Users } from "lucide-react";
import { Avatar, AvatarGroup } from "@mui/material";

// กำหนด Props เพื่อให้รับข้อมูลจาก Backend มาแสดงผลได้แบบ Dynamic
interface BoardHeaderProps {
  title?: string;
  budgetUsed?: number;
}

export function BoardHeader({ 
  title = "Mini ERP Kanban", 
  budgetUsed = 100000 
}: BoardHeaderProps) {
  return (
    <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-200 gap-6 relative z-10">
      
      {/* ด้านซ้าย: ข้อมูลโปรเจกต์ */}
      <div className="flex items-center gap-4">
        {/* จัดกลุ่ม Icon ให้อยู่ในกรอบสวยงาม */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
          <Kanban className="h-7 w-7 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            {title}
          </h1>
          {/* Subtitle อธิบายโปรเจกต์ ช่วยเติมเต็ม Layout ไม่ให้ดูโล่งเกินไป */}
          <p className="text-sm text-slate-500 mt-1">
            Manage your tasks and track project budget in real-time.
          </p>
        </div>
      </div>

      {/* ด้านขวา: Metric และ Team (เรียงกันแบบ Wrap หากจอเล็ก) */}
      <div className="flex flex-wrap items-center gap-5">
        
        {/* Budget Metric (ย่อขนาด Icon และ Text ให้ดู Balance ขึ้น) */}
        <div className="bg-green-50 px-4 py-3 rounded-xl border border-green-100 flex items-center gap-3">
          <div className="bg-green-500 p-2 rounded-full text-white shadow-sm">
            <DollarSign size={16} />
          </div>
          <div>
            <p className="text-[10px] text-green-700 font-bold uppercase tracking-wider">
              Budget Used
            </p>
            <p className="text-lg font-bold text-green-900 leading-none mt-1">
              ${budgetUsed.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* เส้นคั่นกลาง (แสดงเฉพาะจอใหญ่) */}
        <div className="hidden sm:block w-px h-10 bg-slate-200"></div>

        {/* ผู้เข้าร่วมโปรเจกต์ (ใช้ MUI Avatar Group ให้เหมือนตัวอย่าง Craftboard) */}
        <div className="flex items-center gap-3">
          <AvatarGroup 
            max={3} 
            sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: 14, borderColor: 'white' } }}
          >
            {/* ตัวอย่าง Mock รูปภาพ (ในระบบจริงควร Map มาจากข้อมูล User) */}
            <Avatar alt="User 1" src="https://i.pravatar.cc/150?u=1" />
            <Avatar alt="User 2" src="https://i.pravatar.cc/150?u=2" />
            <Avatar alt="User 3" src="https://i.pravatar.cc/150?u=3" />
            <Avatar alt="User 4" src="https://i.pravatar.cc/150?u=4" />
          </AvatarGroup>
          
          {/* ปุ่ม Invite/Manage Team */}
          <button 
            className="flex items-center justify-center h-8 w-8 rounded-full bg-slate-50 text-slate-500 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 transition-colors"
            title="Manage Team"
          >
            <Users size={14} />
          </button>
        </div>

      </div>
    </header>
  );
}