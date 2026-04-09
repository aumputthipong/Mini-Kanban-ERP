package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/go-chi/chi/v5"
)

type SubtaskHandler struct {
	subtaskService service.SubtaskServicer
}

func NewSubtaskHandler(subtaskService service.SubtaskServicer) *SubtaskHandler {
	return &SubtaskHandler{subtaskService: subtaskService}
}

func (h *SubtaskHandler) CreateSubtask(w http.ResponseWriter, r *http.Request) {
	cardID := chi.URLParam(r, "cardID")

	var payload dto.SubtaskRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	subtask, err := h.subtaskService.CreateSubtask(r.Context(), db.CreateSubtaskParams{
		CardID:   cardID,
		Title:    payload.Title,
		Position: payload.Position,
	})
	if err != nil {
		log.Printf("ERROR CreateSubtask: %v", err)
		httputil.RespondError(w, http.StatusInternalServerError, "Failed to create subtask")
		return
	}

	httputil.RespondJSON(w, http.StatusCreated, dto.MapToSubtaskResponse(subtask))
}

func (h *SubtaskHandler) GetSubtasks(w http.ResponseWriter, r *http.Request) {
	cardID := chi.URLParam(r, "cardID")
	if cardID == "" {
		httputil.RespondError(w, http.StatusBadRequest, "Missing card ID")
		return
	}

	subtasks, err := h.subtaskService.GetSubtasksByCardID(r.Context(), cardID)
	if err != nil {
		log.Printf("ERROR GetSubtasks: %v", err)
		httputil.RespondError(w, http.StatusInternalServerError, "Failed to retrieve subtasks")
		return
	}

	httputil.RespondJSON(w, http.StatusOK, dto.MapToSubtaskResponseList(subtasks))
}

func (h *SubtaskHandler) UpdateSubtask(w http.ResponseWriter, r *http.Request) {
	subtaskID := chi.URLParam(r, "subtaskID")
	if subtaskID == "" {
		httputil.RespondError(w, http.StatusBadRequest, "Missing subtask ID")
		return
	}

	var req dto.UpdateSubtaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "Invalid JSON payload")
		return
	}

	subtask, err := h.subtaskService.UpdateSubtask(r.Context(), subtaskID, req)
	if err != nil {
		log.Printf("ERROR UpdateSubtask: %v", err)
		httputil.RespondError(w, http.StatusInternalServerError, "Failed to update subtask")
		return
	}

	httputil.RespondJSON(w, http.StatusOK, dto.MapToSubtaskResponse(subtask))
}

func (h *SubtaskHandler) DeleteSubtask(w http.ResponseWriter, r *http.Request) {
	subtaskID := chi.URLParam(r, "subtaskID")
	if subtaskID == "" {
		httputil.RespondError(w, http.StatusBadRequest, "Missing subtask ID")
		return
	}

	if err := h.subtaskService.DeleteSubtask(r.Context(), subtaskID); err != nil {
		log.Printf("ERROR DeleteSubtask: %v", err)
		httputil.RespondError(w, http.StatusInternalServerError, "Failed to delete subtask")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *SubtaskHandler) GetSubtask(w http.ResponseWriter, r *http.Request) {
	subtaskID := chi.URLParam(r, "subtaskID")
	if subtaskID == "" {
		httputil.RespondError(w, http.StatusBadRequest, "Missing subtask ID")
		return
	}

	subtask, err := h.subtaskService.GetSubtaskByID(r.Context(), subtaskID)
	if err != nil {
		log.Printf("ERROR GetSubtask: %v", err)
		httputil.RespondError(w, http.StatusNotFound, "Subtask not found")
		return
	}

	httputil.RespondJSON(w, http.StatusOK, dto.MapToSubtaskResponse(subtask))
}
