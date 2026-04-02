import { cookies } from "next/headers";
import { Trash2 } from "lucide-react";
import { TrashTable } from "@/components/trash/TrashTable";
import { API_URL } from "@/lib/constants";

// กำหนด Type เป็นตัวพิมพ์เล็กทั้งหมดตามที่ API ฝั่ง Go ส่งมา
export interface TrashedBoard {
  id: string;
  title: string;
  deleted_at: string;
}

async function getTrashedBoards(): Promise<TrashedBoard[]> {
  try {
    const cookieStore = await cookies();
    const cookieString = cookieStore.toString();

    const res = await fetch(`${API_URL}/trash`, {
      cache: "no-store",
      headers: {
        Cookie: cookieString,
      },
    });

    if (!res.ok) {
      console.error("API Error:", res.status, res.statusText);
      return [];
    }
    
    return await res.json();
  } catch (err) {
    console.error("Fetch Error:", err);
    return [];
  }
}

export default async function TrashPage() {
  const trashedBoards = await getTrashedBoards();

  return (
    <main className="p-10 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8 flex items-center gap-3">
          <Trash2 className="text-slate-400" />
          Trash Bin
        </h1>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          {trashedBoards.length === 0 ? (
            <div className="p-20 text-center text-slate-400">
              Your trash is empty.
            </div>
          ) : (
            <TrashTable boards={trashedBoards} />
          )}
        </div>
      </div>
    </main>
  );
}