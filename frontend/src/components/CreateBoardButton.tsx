"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateBoardButton() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateBoard = async () => {
    const title = prompt("Enter new project name:");
    if (!title) return;

    setIsCreating(true);

    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api";
      const response = await fetch(`${apiUrl}/boards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title }),
      });

      if (response.ok) {
        const data = await response.json();
        // Redirect ผู้ใช้ไปยังหน้าบอร์ดที่เพิ่งสร้างเสร็จทันที
        router.push(`/boards/${data.id}`);
      }
    } catch (error) {
      console.error("Failed to create board:", error);
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
