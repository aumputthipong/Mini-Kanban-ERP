import { CreateBoardButton } from "@/components/CreateBoardButton";
import { apiFetch } from "@/lib/api";
import { API_URL } from "@/lib/constants";
import { Board } from "@/types/board";
import Link from "next/link";

// Best Practice สำหรับ Next.js 14+:
// หน้า Dashboard ที่ดึงข้อมูลแค่ครั้งเดียวตอนโหลด เราสามารถใช้เป็น Server Component ได้เลย
// (ไม่ต้องใส่ "use client") ทำให้เว็บโหลดเร็วขึ้นและ SEO ดีขึ้นครับ

export default async function DashboardPage() {
  const boards = await apiFetch<Board[]>("/boards", { cache: "no-store" });

  // ดึงข้อมูลรายชื่อโปรเจกต์ (ใช้ cache: 'no-store' เพื่อให้ดึงข้อมูลใหม่เสมอเมื่อรีเฟรชหน้า)
  const res = await fetch(`${API_URL}/boards`, { cache: "no-store" });
  // const boards = await res.json();

  return (
    <main className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            My Projects
          </h1>

          {/* ปุ่มสำหรับสร้างบอร์ดใหม่ (เดี๋ยวเราค่อยมาทำฟังก์ชันนี้ทีหลัง) */}
          <CreateBoardButton />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {boards.map((board: any) => (
            // ใช้ Component <Link> ของ Next.js เพื่อให้เปลี่ยนหน้าโดยไม่ต้องโหลดเว็บใหม่ (SPA Routing)
          <Link key={board.id} href={`/board/${board.id}`}>
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 
                  hover:shadow-md hover:-translate-y-1 hover:border-blue-300 
                  transition-all duration-200 cursor-pointer flex flex-col justify-between group h-40">
    
    <div className="flex justify-between items-start">
      <h2 className="text-xl font-bold text-slate-700 group-hover:text-blue-600 transition-colors line-clamp-1">
        {board.title}
      </h2>
      {/* จุดแสดงสถานะ เช่น สีเขียวคือมีอัปเดตล่าสุด สีเทาคือไม่มีความเคลื่อนไหว */}
      <span className="h-2 w-2 rounded-full bg-green-500"></span>
    </div>

    {/* พื้นที่สำหรับแสดงสถิติของการ์ด (Mockup) */}
    <div className="mt-4">
      <div className="flex justify-between text-xs text-slate-500 mb-2 font-medium">
        <span>Progress</span>
        <span>65%</span>
      </div>
      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5">
        <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "65%" }}></div>
      </div>
      
      <div className="flex justify-between items-center mt-4">
        <div className="text-xs text-slate-400 font-medium">
          <span className="text-slate-600 font-bold">12</span> Tasks
        </div>
        <div className="text-xs text-slate-400 font-medium group-hover:text-blue-500 transition-colors">
          Enter workspace &rarr;
        </div>
      </div>
    </div>

  </div>
</Link>
          ))}
        </div>
      </div>
    </main>
  );
}
