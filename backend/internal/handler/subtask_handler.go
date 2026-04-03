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

// UpdateSubtask รับ HTTP PATCH request
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

	// เรียก Service เพื่ออัปเดตข้อมูล
	subtask, err := h.subtaskService.UpdateSubtask(r.Context(), subtaskID, req)
	if err != nil {
		// 🌟 [ปรับปรุง]: เพิ่ม Log เพื่อให้คุณอั้มดู Error ง่ายขึ้นเวลาหน้าเว็บยิงมาพัง
		log.Printf(" ERROR UpdateSubtask: %v", err)
		httputil.RespondError(w, http.StatusInternalServerError, "Failed to update subtask")
		return
	}

	// ใช้ Mapper เพื่อแปลง DB Model เป็น DTO ก่อนส่งกลับ Frontend
	response := dto.MapToSubtaskResponse(subtask)
	httputil.RespondJSON(w, http.StatusOK, response)
}

// DeleteSubtask รับ HTTP DELETE request
func (h *SubtaskHandler) DeleteSubtask(w http.ResponseWriter, r *http.Request) {
	subtaskID := chi.URLParam(r, "subtaskID")
	if subtaskID == "" {
		httputil.RespondError(w, http.StatusBadRequest, "Missing subtask ID")
		return
	}

	err := h.subtaskService.DeleteSubtask(r.Context(), subtaskID)
	if err != nil {
		httputil.RespondError(w, http.StatusInternalServerError, "Failed to delete subtask")
		return
	}

	// Best Practice สำหรับการลบสำเร็จคือคืนค่า 204 No Content (ไม่มี Body กลับไป)
	w.WriteHeader(http.StatusNoContent)
}
