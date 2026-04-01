package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/pgutil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (h *BoardHandler) CreateCard(w http.ResponseWriter, r *http.Request) error {

	var req dto.CreateCardRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	colUUID, err := uuid.Parse(req.ColumnID)
	if err := colUUID.Scan(req.ColumnID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid column ID", err)
	}

	card, err := h.boardService.CreateCard(r.Context(), db.CreateCardParams{
		ColumnID: colUUID,
		Title:    req.Title,
		Position: 0,
		DueDate:  pgutil.PtrToDate(req.DueDate),
		// AssigneeID ใช้ pgutil.PtrToUUID ถ้ามี helper นั้น
		Priority: pgutil.PtrToText(req.Priority),
	})
	if err != nil {
		log.Printf("Error creating card: %v", err)
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to create card", err)
	}
	json.NewEncoder(w).Encode(card)
	return nil
}

func (h *BoardHandler) UpdateCard(w http.ResponseWriter, r *http.Request) error {

	cardIDStr := r.PathValue("cardID")
	if cardIDStr == "" {
		return httputil.NewAPIError(http.StatusBadRequest, "Card ID is required", nil)
	}

	cardUUID, err := uuid.Parse(cardIDStr)
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid card ID format", err)
	}

	// 2. ถอดรหัส JSON
	var req dto.UpdateCardRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	// 3. แปลงข้อมูล Title (*string -> string)
	var title string
	if req.Title != nil {
		title = *req.Title // ดึงค่า String ออกมาจาก Pointer
	}

	// 4. แปลงข้อมูล DueDate (*string -> *time.Time)
	var dueDate *time.Time
	if req.DueDate != nil && *req.DueDate != "" {
		// สมมติว่าหน้าเว็บส่งมาในรูปแบบ ISO 8601 (เช่น "2026-04-01T15:00:00Z")
		// หากหน้าเว็บส่งมาแค่ "2026-04-01" ให้เปลี่ยนเวลาอ้างอิงเป็น time.DateOnly
		parsedTime, err := time.Parse(time.RFC3339, *req.DueDate)
		if err != nil {
			return httputil.NewAPIError(http.StatusBadRequest, "Invalid due_date format", err)
		}
		dueDate = &parsedTime
	}
	var assigneeID *uuid.UUID
	if req.AssigneeID != nil && *req.AssigneeID != "" {
		parsedUUID, err := uuid.Parse(*req.AssigneeID)
		if err != nil {
			return httputil.NewAPIError(http.StatusBadRequest, "Invalid assignee_id format", err)
		}
		assigneeID = &parsedUUID
	}
	card, err := h.boardService.UpdateCard(r.Context(), service.UpdateCardParams{
		ID:          cardUUID,
		Title:       title,           
		Description: req.Description, 
		DueDate:     dueDate,         
		AssigneeID:  assigneeID,      
		Priority:    req.Priority,    
	})
	if err != nil {
		log.Printf("UpdateCard error: %v", err)
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to update card", err)
	}

	httputil.RespondJSON(w, http.StatusOK, card)
	return nil
}

func (h *BoardHandler) GetCard(w http.ResponseWriter, r *http.Request) error {
	// 1. อ่านค่า cardID จาก URL
	cardIDStr := chi.URLParam(r, "cardID")

	// 2. แปลง String เป็น UUID (Best Practice: ตรวจสอบ Format ก่อนไปตี Database)
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid card ID format", err)
	}

	// 3. เรียกใช้ Service เพื่อดึงข้อมูล (ส่ง context ไปด้วยเสมอ)
	card, err := h.boardService.GetCard(r.Context(), cardID)
	if err != nil {
		// Best Practice: แยกประเภทของ Error เพื่อส่ง HTTP Status ให้ถูกต้อง
		if errors.Is(err, sql.ErrNoRows) {
			// ถ้าหาไม่เจอ ให้ส่ง 404 Not Found
			return httputil.NewAPIError(http.StatusNotFound, "Card not found", nil)
		}
		// ถ้าเป็น Error อื่นๆ จากระบบ ให้ส่ง 500
		return httputil.NewAPIError(http.StatusInternalServerError, "Internal server error", err)
	}

	// 4. ตั้งค่า Header ว่าข้อมูลที่จะส่งกลับไปเป็น JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	// 5. แปลง Struct card เป็น JSON แล้วส่งกลับ
	if err := json.NewEncoder(w).Encode(card); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to encode response", err)
	}
	return nil
}
