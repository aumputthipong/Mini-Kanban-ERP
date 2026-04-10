package handler

import (
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/mapper"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type SubtaskHandler struct {
	subtaskService service.SubtaskServicer
}

func NewSubtaskHandler(subtaskService service.SubtaskServicer) *SubtaskHandler {
	return &SubtaskHandler{subtaskService: subtaskService}
}

func (h *SubtaskHandler) CreateSubtask(w http.ResponseWriter, r *http.Request) error {
	cardID := chi.URLParam(r, "cardID")

	var payload dto.SubtaskRequest
	if err := httputil.DecodeJSON(r, &payload); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request payload", err)
	}

	subtask, err := h.subtaskService.CreateSubtask(r.Context(), db.CreateSubtaskParams{
		CardID:   cardID,
		Title:    payload.Title,
		Position: payload.Position,
	})
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to create subtask", err)
	}

	httputil.RespondJSON(w, http.StatusCreated, mapper.ToSubtaskResponse(subtask))
	return nil
}

func (h *SubtaskHandler) GetSubtasks(w http.ResponseWriter, r *http.Request) error {
	cardID := chi.URLParam(r, "cardID")
	if cardID == "" {
		return httputil.NewAPIError(http.StatusBadRequest, "Missing card ID", nil)
	}

	subtasks, err := h.subtaskService.GetSubtasksByCardID(r.Context(), cardID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to retrieve subtasks", err)
	}

	httputil.RespondJSON(w, http.StatusOK, mapper.ToSubtaskResponses(subtasks))
	return nil
}

func (h *SubtaskHandler) UpdateSubtask(w http.ResponseWriter, r *http.Request) error {
	subtaskID := chi.URLParam(r, "subtaskID")
	if subtaskID == "" {
		return httputil.NewAPIError(http.StatusBadRequest, "Missing subtask ID", nil)
	}

	var req dto.UpdateSubtaskRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid JSON payload", err)
	}

	subtask, err := h.subtaskService.UpdateSubtask(r.Context(), subtaskID, req)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to update subtask", err)
	}

	httputil.RespondJSON(w, http.StatusOK, mapper.ToSubtaskResponse(subtask))
	return nil
}

func (h *SubtaskHandler) DeleteSubtask(w http.ResponseWriter, r *http.Request) error {
	subtaskID := chi.URLParam(r, "subtaskID")
	if subtaskID == "" {
		return httputil.NewAPIError(http.StatusBadRequest, "Missing subtask ID", nil)
	}

	if err := h.subtaskService.DeleteSubtask(r.Context(), subtaskID); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to delete subtask", err)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (h *SubtaskHandler) GetSubtask(w http.ResponseWriter, r *http.Request) error {
	subtaskID := chi.URLParam(r, "subtaskID")
	if subtaskID == "" {
		return httputil.NewAPIError(http.StatusBadRequest, "Missing subtask ID", nil)
	}

	subtask, err := h.subtaskService.GetSubtaskByID(r.Context(), subtaskID)
	if err != nil {
		return httputil.NewAPIError(http.StatusNotFound, "Subtask not found", err)
	}

	httputil.RespondJSON(w, http.StatusOK, mapper.ToSubtaskResponse(subtask))
	return nil
}
