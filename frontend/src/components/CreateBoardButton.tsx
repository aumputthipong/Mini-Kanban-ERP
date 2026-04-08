"use client";

import { apiClient } from "@/lib/apiClient";
import { API_URL } from "@/lib/constants";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateBoardButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

const handleCreateBoard = async () => {
    const title = prompt("Enter new project name:");
    
    // เพิ่ม .trim() เพื่อป้องกันผู้ใช้กรอกแค่ช่องว่าง (Spacebar)
    if (!title || !title.trim()) return;

    setIsCreating(true);

    try {
      // apiClient จะเปลี่ยนเป็น POST อัตโนมัติเมื่อมีการส่ง data
      // และเราสามารถระบุ Type ให้ผลลัพธ์ที่ตอบกลับมาได้เลย
      const newBoard = await apiClient<{ id: string }>("/boards", {
        data: { title: title.trim() },
      });

      // Redirect ผู้ใช้ไปยังหน้าบอร์ดที่เพิ่งสร้างเสร็จทันที
      router.push(`/board/${newBoard.id}/tasks`);
      
    } catch (error) {
      console.error("Failed to create board:", error);
      // แนะนำทางเลือก: ควรมี UI แจ้งเตือนผู้ใช้ เช่น alert หรือ Toast
      alert(error instanceof Error ? error.message : "Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <button
      onClick={handleCreateBoard}
      disabled={isCreating}
      className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-lg font-medium transition-colors"
    >
      {isCreating ? "Creating..." : "+ New Project"}
    </button>
  );
}
