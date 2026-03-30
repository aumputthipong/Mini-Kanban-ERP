"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useState } from "react";

interface MoveToTrashButtonProps {
  boardId: string;
  boardTitle: string;
}

export default function MoveToTrashButton({ boardId, boardTitle }: MoveToTrashButtonProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleMoveToTrash = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!window.confirm(`Move project "${boardTitle}" to trash?`)) {
      return;
    }

    setIsDeleting(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const res = await fetch(`${apiUrl}/boards/${boardId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Failed to move to trash");
      }

      // สั่งให้ Next.js รีเฟรชข้อมูล Server Component ใหม่โดยที่หน้าจอไม่กระพริบ
      router.refresh();
      
    } catch (error) {
      console.error(error);
      alert("Unable to move project to trash at this time.");
      setIsDeleting(false);
    }
  };

  return (
    <button
      onClick={handleMoveToTrash}
      disabled={isDeleting}
      className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50"
      title="Move to Trash"
    >
      <Trash2 size={18} />
    </button>
  );
}