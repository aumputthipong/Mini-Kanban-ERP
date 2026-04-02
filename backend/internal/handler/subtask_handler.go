package handler

import (
	"encoding/json"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/go-chi/chi/v5"
)

type SubtaskHandler struct {
	queries *db.Queries
}

func NewSubtaskHandler(queries *db.Queries) *SubtaskHandler {
	return &SubtaskHandler{queries: queries}
}

// CreateSubtask สร้าง Subtask ใหม่ภายใต้ Card ที่กำหนด
func (h *SubtaskHandler) CreateSubtask(w http.ResponseWriter, r *http.Request) {
	cardID := chi.URLParam(r, "cardId") // รับ cardId จาก URL path
	
	var payload dto.SubtaskRequest
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		httputil.RespondError(w, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// บันทึกลง Database ผ่าน sqlc
	subtask, err := h.queries.CreateSubtask(r.Context(), db.CreateSubtaskParams{
		CardID:   cardID,
		Title:    payload.Title,
		Position: payload.Position,
	})

	if err != nil {
		httputil.RespondError(w, http.StatusInternalServerError, "Failed to create subtask")
		return
	}

	httputil.RespondJSON(w, http.StatusCreated, subtask)
}