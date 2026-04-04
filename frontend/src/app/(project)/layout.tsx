// src/app/(project)/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { apiClient } from "@/lib/apiClient";
import { API_URL } from "@/lib/constants";
import type { Board } from "@/types/board";
import { cookies } from "next/headers"; // 1. นำเข้า cookies

async function getBoards(): Promise<Board[]> {
  try {
    const cookieStore = await cookies();

    // เรียกใช้ apiClient พร้อมแนบ Cookie และตั้งค่า cache
    const boards = await apiClient<Board[]>("/boards", {
      cache: "no-store", 
      headers: {
        Cookie: cookieStore.toString(),
      },
    });

    return boards;
  } catch (error) {
    console.error("Network error fetching boards in layout:", error);
    return [];
  }
}
export default async function ProjectLayout({ children }: { children: React.ReactNode }) {
  const boards = await getBoards();
  return (
    <div className="flex flex-1 min-h-0">
      <Sidebar boards={boards} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}