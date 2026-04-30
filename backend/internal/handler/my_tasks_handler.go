package handler

import (
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/google/uuid"
)

func (h *BoardHandler) GetMyTasks(w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		return httputil.NewAPIError(http.StatusUnauthorized, "Unauthorized", nil)
	}

	tasks, err := h.boardService.GetMyTasks(r.Context(), userID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to load my tasks", err)
	}

	out := make([]dto.MyTaskResponse, 0, len(tasks))
	for _, t := range tasks {
		var due *string
		if t.DueDate != nil {
			s := t.DueDate.Format("2006-01-02")
			due = &s
		}
		out = append(out, dto.MyTaskResponse{
			ID:             t.ID,
			Title:          t.Title,
			BoardID:        t.BoardID,
			BoardName:      t.BoardName,
			ColumnName:     t.ColumnName,
			Priority:       t.Priority,
			DueDate:        due,
			EstimatedHours: t.EstimatedHours,
			Status:         t.Status,
		})
	}

	httputil.RespondJSON(w, http.StatusOK, out)
	return nil
}

func (h *BoardHandler) CompleteMyTask(w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		return httputil.NewAPIError(http.StatusUnauthorized, "Unauthorized", nil)
	}

	cardID, err := httputil.GetUUIDParam(r, "cardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid card ID", err)
	}
	if _, err := uuid.Parse(cardID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid card ID", err)
	}

	ok, err = h.boardService.CompleteMyTask(r.Context(), cardID, userID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to complete task", err)
	}
	if !ok {
		// Not the assignee, or card doesn't exist.
		return httputil.NewAPIError(http.StatusNotFound, "Task not found", nil)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}
