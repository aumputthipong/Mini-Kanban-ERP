import { CreateBoardButton } from "@/components/CreateBoardButton";
import Link from "next/link";

// Best Practice สำหรับ Next.js 14+:
// หน้า Dashboard ที่ดึงข้อมูลแค่ครั้งเดียวตอนโหลด เราสามารถใช้เป็น Server Component ได้เลย
// (ไม่ต้องใส่ "use client") ทำให้เว็บโหลดเร็วขึ้นและ SEO ดีขึ้นครับ

export default async function DashboardPage() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";

  // ดึงข้อมูลรายชื่อโปรเจกต์ (ใช้ cache: 'no-store' เพื่อให้ดึงข้อมูลใหม่เสมอเมื่อรีเฟรชหน้า)
  const res = await fetch(`${apiUrl}/boards`, { cache: "no-store" });
  const boards = await res.json();

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
            <Link key={board.id} href={`/boards/${board.id}`}>
              <div
                className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 
                              hover:shadow-md hover:-translate-y-1 hover:border-blue-300 
                              transition-all duration-200 cursor-pointer h-32 flex flex-col justify-between group"
              >
                <h2 className="text-xl font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                  {board.title}
                </h2>
                <div className="flex items-center text-sm text-slate-400 font-medium">
                  <span>Enter workspace &rarr;</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
