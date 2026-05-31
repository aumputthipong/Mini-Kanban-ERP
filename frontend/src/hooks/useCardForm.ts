// components/kanban/card-modal/useCardForm.ts
import { useState, useEffect, useCallback, useRef } from "react";
import type { Card, BoardMember, Tag } from "@/types/board";
import { API_URL } from "@/lib/constants";
import { FormState } from "../components/board/card-modal/CardDetailModal"; // หรือย้าย type FormState มาไว้ที่นี่

/**
 * Owns the editable form for one card. State initialises from the `card`
 * prop once and is NOT sync'd back via useEffect — callers must remount the
 * consuming modal with `key={card.id}` to reset the form when switching
 * cards. See CardDetailModal callers (BoardDashboard, TaskCard).
 */
export function useCardForm(card: Card, boardId: string, isOpen: boolean) {
  const [form, setForm] = useState<FormState>({
    title: card.title,
    description: card.description ?? "",
    due_date: card.due_date ?? "",
    assignee_id: card.assignee_id ?? "",
    priority: card.priority ?? "",
    estimated_hours: card.estimated_hours != null ? String(card.estimated_hours) : "",
    tags: card.tags ?? [],
    acceptance_criteria: card.acceptance_criteria ?? "",
    implementation_note: card.implementation_note ?? "",
  });

  const [members, setMembers] = useState<BoardMember[]>([]);
  const [error, setError] = useState<string | null>(null);

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
  const cardTagIds = (card.tags ?? []).map((t) => t.id).sort().join(",");
  const formTagIds = form.tags.map((t) => t.id).sort().join(",");
  const isDirty =
    form.title !== card.title ||
    form.description !== (card.description ?? "") ||
    form.due_date !== (card.due_date ?? "") ||
    form.assignee_id !== (card.assignee_id ?? "") ||
    form.priority !== (card.priority ?? "") ||
    form.estimated_hours !== (card.estimated_hours != null ? String(card.estimated_hours) : "") ||
    formTagIds !== cardTagIds ||
    form.acceptance_criteria !== (card.acceptance_criteria ?? "") ||
    form.implementation_note !== (card.implementation_note ?? "");

  // Helper สำหรับ Update State (text/select inputs).
  //
  // Each field's handler is cached so its identity is STABLE across renders.
  // Without this, `handleChange("title")` returns a fresh closure every render,
  // which defeats React.memo on every child receiving an onChange — the whole
  // modal then re-renders on every keystroke.
  type ChangeHandler = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
  const handlersRef = useRef<Partial<Record<keyof FormState, ChangeHandler>>>({});
  const handleChange = useCallback((field: keyof FormState): ChangeHandler => {
    const cached = handlersRef.current[field];
    if (cached) return cached;
    const handler: ChangeHandler = (e) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    handlersRef.current[field] = handler;
    return handler;
  }, []);

  // Setter สำหรับ tags (ไม่ผ่าน ChangeEvent เพราะเป็น array)
  const setTags = useCallback((tags: Tag[]) => {
    setForm((prev) => ({ ...prev, tags }));
  }, []);

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
    setTags,
    validate,
  };
}