// hooks/useBoardSettings.ts
import { useState } from "react";
import { useRouter } from "next/navigation";
import { API_URL } from "@/lib/constants";

export function useBoardSettings(boardId: string) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  // ฟังก์ชันอัปเดตข้อมูลทีละฟิลด์
  const updateField = async (fieldKey: string, value: string | number) => {
    const res = await fetch(`${API_URL}/boards/${boardId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [fieldKey]: value }),
    });

    if (!res.ok) throw new Error("Failed to save");
    router.refresh();
  };

  // ฟังก์ชันลบบอร์ด
  const deleteBoard = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error(`Failed to delete (${res.status})`);
      
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      setIsDeleting(false);
    }
  };

  return { updateField, deleteBoard, isDeleting };
}