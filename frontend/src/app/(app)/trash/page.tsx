import { cookies } from "next/headers";
import { Trash2 } from "lucide-react";
import { TrashTable } from "@/components/trash/TrashTable";
import { API_URL } from "@/lib/constants";
import { apiClient } from "@/lib/apiClient";

// กำหนด Type เป็นตัวพิมพ์เล็กทั้งหมดตามที่ API ฝั่ง Go ส่งมา
export interface TrashedBoard {
  id: string;
  title: string;
  deleted_at: string;
}

export async function getTrashedBoards(): Promise<TrashedBoard[]> {
  try {
    const cookieStore = await cookies();

    return await apiClient<TrashedBoard[]>("/trash", {
      cache: "no-store",
      headers: {
        Cookie: cookieStore.toString(),
      },
    });
  } catch (err) {
    console.error("Fetch Trashed Boards Error:", err);
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