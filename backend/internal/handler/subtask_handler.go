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
	"github.com/jackc/pgx/v5/pgtype"
)

type SubtaskHandler struct {
	subtaskService *service.SubtaskService
}

func NewSubtaskHandler(subtaskService *service.SubtaskService) *SubtaskHandler {
	return &SubtaskHandler{subtaskService: subtaskService}
}

// CreateSubtask สร้าง Subtask ใหม่ภายใต้ Card ที่กำหนด
func (h *SubtaskHandler) CreateSubtask(w http.ResponseWriter, r *http.Request) {
	cardId := chi.URLParam(r, "cardID")

	var payload dto.SubtaskRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	var cardUUID pgtype.UUID
	if err := cardUUID.Scan(cardId); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "Invalid card ID")
		return
	}

	subtask, err := h.subtaskService.CreateSubtask(r.Context(), db.CreateSubtaskParams{
		CardID:   cardId, // ลองส่งเป็น string ที่ได้จาก chi.URLParam ตรงๆ
		Title:    payload.Title,
		Position: payload.Position,
	})
	if err != nil {
		log.Printf("ERROR CreateSubtask: %v", err)

		httputil.RespondError(w, http.StatusInternalServerError, "Failed to create subtask")
		return
	}
	response := dto.MapToSubtaskResponse(subtask)

	httputil.RespondJSON(w, http.StatusCreated, response)
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

	response := dto.MapToSubtaskResponseList(subtasks)

	httputil.RespondJSON(w, http.StatusOK, response)
}
