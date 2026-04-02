// src/app/(project)/layout.tsx
import { Sidebar } from "@/components/layout/Sidebar";
import { API_URL } from "@/lib/constants";
import type { Board } from "@/types/board";
import { cookies } from "next/headers"; // 1. นำเข้า cookies

async function getBoards(): Promise<Board[]> {
  try {
    const cookieStore = await cookies();
    const allCookies = cookieStore.toString();

    const res = await fetch(`${API_URL}/boards`, { 
      cache: 'no-store', 
      headers: {
        "Cookie": allCookies,
        "Content-Type": "application/json",
      }
    });
    console.log("This is ",res )

    if (!res.ok) {
      console.error(`Fetch boards failed: ${res.status}`);
      return [];
    }
    
    return await res.json();
  } catch (error) {
    console.error("Network error fetching boards:", error);
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