// components/kanban/card-modal/useCardForm.ts
import { useState, useEffect } from "react";
import type { Card, BoardMember } from "@/types/board";
import { API_URL } from "@/lib/constants";
import { FormState } from "../components/board/card-modal/CardDetailModal"; // หรือย้าย type FormState มาไว้ที่นี่

export function useCardForm(card: Card, boardId: string, isOpen: boolean) {
  const [form, setForm] = useState<FormState>({
    title: card.title,
    description: card.description ?? "",
    due_date: card.due_date ?? "",
    assignee_id: card.assignee_id ?? "",
    priority: card.priority ?? "",
    estimated_hours: card.estimated_hours != null ? String(card.estimated_hours) : "",
  });

  const [members, setMembers] = useState<BoardMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Sync ฟอร์มเมื่อ Card ต้นทางเปลี่ยน
  useEffect(() => {
    setForm({
      title: card.title,
      description: card.description ?? "",
      due_date: card.due_date ?? "",
      assignee_id: card.assignee_id ?? "",
      priority: card.priority ?? "",
      estimated_hours: card.estimated_hours != null ? String(card.estimated_hours) : "",
    });
    setError(null);
  }, [card]);

  // Fetch รายชื่อ Member ใน Board
  useEffect(() => {
    if (!isOpen || !boardId) return;
    const fetchMembers = async () => {
      try {
        const res = await fetch(`${API_URL}/boards/${boardId}/members`, {
          credentials: "include",
        });
        if (res.ok) setMembers(await res.json());
      } catch (err) {
        console.error("Failed to fetch members", err);
      }
    };
    fetchMembers();
  }, [isOpen, boardId]);

  // คำนวณว่ามีการแก้ไขข้อมูลหรือไม่
  const isDirty =
    form.title !== card.title ||
    form.description !== (card.description ?? "") ||
    form.due_date !== (card.due_date ?? "") ||
    form.assignee_id !== (card.assignee_id ?? "") ||
    form.priority !== (card.priority ?? "") ||
    form.estimated_hours !== (card.estimated_hours != null ? String(card.estimated_hours) : "");

  // Helper สำหรับ Update State
  const handleChange = (field: keyof FormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const validate = () => {
    if (!form.title.trim()) {
      setError("Title cannot be empty.");
      return false;
    }
    return true;
  };

  const assigneeName = members.find((m) => m.user_id === form.assignee_id)?.full_name;

  return {
    form,
    members,
    error,
    isDirty,
    assigneeName,
    handleChange,
    validate,
  };
}