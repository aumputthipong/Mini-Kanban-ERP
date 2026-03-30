// components/trash/TrashTable.tsx
"use client";

import { useState } from "react";
import { Trash2, RotateCcw, Loader2 } from "lucide-react";

import { useRouter } from "next/navigation";
import { TrashedBoard } from "@/app/(app)/trash/page";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080/api";

interface TrashTableProps {
  boards: TrashedBoard[];
}

export function TrashTable({ boards: initialBoards }: TrashTableProps) {
  const router = useRouter();
  const [boards, setBoards] = useState(initialBoards);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRestore = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`${API_URL}/trash/${id}/restore`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Failed to restore");
      setBoards((prev) => prev.filter((b) => b.ID !== id));
      router.refresh();
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`${API_URL}/trash/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      setBoards((prev) => prev.filter((b) => b.ID !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <table className="w-full text-left border-collapse">
      <thead className="bg-slate-50 border-b border-slate-100">
        <tr>
          <th className="p-4 text-xs font-bold text-slate-400 uppercase">
            Project Title
          </th>
          <th className="p-4 text-xs font-bold text-slate-400 uppercase">
            Deleted At
          </th>
          <th className="p-4 text-xs font-bold text-slate-400 uppercase text-right">
            Actions
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {boards.map((board) => {
          const isLoading = loadingId === board.ID;
          return (
            <tr key={board.ID} className="hover:bg-slate-50 transition-colors">
              <td className="p-4 font-semibold text-slate-700">
                {board.Title}
              </td>
              <td className="p-4 text-sm text-slate-500">
                {new Date(board.DeletedAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleRestore(board.ID)}
                    disabled={isLoading}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"
                    title="Restore"
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <RotateCcw size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(board.ID)}
                    disabled={isLoading}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-50 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}