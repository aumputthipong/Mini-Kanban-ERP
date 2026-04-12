import { useBoardStore } from "@/store/useBoardStore";
import { API_URL } from "@/lib/constants";
import type { Subtask } from "@/types/board";

export function useSubtaskActions() {
  const { columns, updateCard } = useBoardStore();

  const fetchSubtasks = async (cardId: string) => {
    try {
      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch subtasks");
      const data: Subtask[] = await response.json();
      useBoardStore.getState().setSubtasksToCard(cardId, data);
    } catch (error) {
      console.error("Error fetching subtasks:", error);
    }
  };

  const handleAddSubtask = async (cardId: string, title: string) => {
    try {
      const targetCard = columns.flatMap((c) => c.cards).find((c) => c.id === cardId);
      if (!targetCard) return;

      const currentSubtasks = targetCard.subtasks || [];
      const newPosition = currentSubtasks.length + 1;

      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ title, position: newPosition }),
      });

      if (!response.ok) throw new Error("Failed to create subtask");

      const newSubtask: Subtask = await response.json();

      updateCard({
        ...targetCard,
        subtasks: [...currentSubtasks, newSubtask],
        total_subtasks: targetCard.total_subtasks + 1,
      });
    } catch (error) {
      console.error("Error creating subtask:", error);
    }
  };

  const handleToggleSubtask = async (
    cardId: string,
    subtaskId: string,
    currentStatus: boolean,
  ) => {
    const newStatus = !currentStatus;
    useBoardStore.getState().updateSubtaskInCard(cardId, subtaskId, { is_done: newStatus });

    try {
      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_done: newStatus }),
      });
      if (!response.ok) throw new Error("Failed to update subtask");
    } catch (error) {
      console.error("Error updating subtask:", error);
      useBoardStore.getState().updateSubtaskInCard(cardId, subtaskId, { is_done: currentStatus });
    }
  };

  const handleDeleteSubtask = async (cardId: string, subtaskId: string) => {
    useBoardStore.getState().deleteSubtaskFromCard(cardId, subtaskId);
    try {
      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks/${subtaskId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete subtask");
    } catch (error) {
      console.error("Error deleting subtask:", error);
    }
  };

  const handleUpdateSubtaskTitle = async (
    cardId: string,
    subtaskId: string,
    newTitle: string,
  ) => {
    if (!newTitle.trim()) return;
    useBoardStore.getState().updateSubtaskInCard(cardId, subtaskId, { title: newTitle.trim() });

    try {
      const response = await fetch(`${API_URL}/cards/${cardId}/subtasks/${subtaskId}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle.trim() }),
      });
      if (!response.ok) throw new Error("Failed to update subtask title");
    } catch (error) {
      console.error("Error updating subtask title:", error);
      fetchSubtasks(cardId);
    }
  };

  return {
    fetchSubtasks,
    handleAddSubtask,
    handleToggleSubtask,
    handleDeleteSubtask,
    handleUpdateSubtaskTitle,
  };
}
