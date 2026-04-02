"use client";

import { useState } from "react";
import { Trash2, RotateCcw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";
import type { TrashedBoard } from "@/app/(app)/trash/page"; // ดึง Type มาจากหน้า page

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
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to restore");

      setBoards((prev) => prev.filter((b) => b.id !== id));
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
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");

      setBoards((prev) => prev.filter((b) => b.id !== id));
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
          // เปลี่ยนจาก board.ID เป็น board.id
          const isLoading = loadingId === board.id;

          return (
            <tr key={board.id} className="hover:bg-slate-50 transition-colors">
              <td className="p-4 font-semibold text-slate-700">
                {board.title} {/* เปลี่ยนจาก Title เป็น title */}
              </td>
              <td className="p-4 text-sm text-slate-500">
                {/* เปลี่ยนจาก DeletedAt เป็น deleted_at */}
                {new Date(board.deleted_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </td>
              <td className="p-4 text-right">
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => handleRestore(board.id)}
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
                    onClick={() => handleDelete(board.id)}
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
