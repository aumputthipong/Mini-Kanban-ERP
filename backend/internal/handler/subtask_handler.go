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
	// 1. ดึง ID จาก URL
	subtaskID := chi.URLParam(r, "subtaskID")
	if subtaskID == "" {
		httputil.RespondError(w, http.StatusBadRequest, "Missing subtask ID")
		return
	}

	// 2. เรียก Service เพื่อลบข้อมูล
	err := h.subtaskService.DeleteSubtask(r.Context(), subtaskID)
	if err != nil {
		log.Printf("ERROR DeleteSubtask: %v", err)
		httputil.RespondError(w, http.StatusInternalServerError, "Failed to delete subtask")
		return
	}

	// 3. Best Practice สำหรับการ Delete คือคืนค่า 204 No Content
	// หมายความว่า "ทำตามคำสั่งสำเร็จแล้ว และไม่มีข้อมูลอะไรจะส่งกลับไปให้ดูนะ"
	w.WriteHeader(http.StatusNoContent)
}

// GetSubtask รับ HTTP GET request เพื่อดึงข้อมูล Subtask ตาม ID
func (h *SubtaskHandler) GetSubtask(w http.ResponseWriter, r *http.Request) {
	// 1. ดึง ID จาก URL parameter
	subtaskID := chi.URLParam(r, "subtaskID")
	if subtaskID == "" {
		httputil.RespondError(w, http.StatusBadRequest, "Missing subtask ID")
		return
	}

	// 2. เรียก Service เพื่อค้นหาข้อมูล
	subtask, err := h.subtaskService.GetSubtaskByID(r.Context(), subtaskID)
	if err != nil {
		log.Printf("ERROR GetSubtask: %v", err)
		// Best Practice: ถ้าดึงข้อมูลแค่ตัวเดียวแล้วหาไม่เจอ ควรตอบกลับเป็น 404 Not Found
		httputil.RespondError(w, http.StatusNotFound, "Subtask not found")
		return
	}

	// 3. ใช้ Mapper ที่เราสร้างไว้ใน DTO เพื่อแปลงหน้าตา JSON ให้ถูกต้อง (snake_case)
	response := dto.MapToSubtaskResponse(subtask)

	// 4. ส่งข้อมูลกลับเป็น JSON ด้วย Status 200 OK
	httputil.RespondJSON(w, http.StatusOK, response)
}