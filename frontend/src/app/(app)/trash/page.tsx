// app/trash/page.tsx
import { TrashTable } from "@/components/trash/TrashTable";
import { Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

export interface TrashedBoard {
  ID: string;
  Title: string;
  DeletedAt: string;
}

async function getTrashedBoards(): Promise<TrashedBoard[]> {
  try {
    const res = await fetch(`${API_URL}/trash`, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
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