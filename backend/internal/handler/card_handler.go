package handler

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/pgutil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgtype"
)

func (h *BoardHandler) CreateCard(w http.ResponseWriter, r *http.Request) {


	var req CreateCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	colUUID, err := uuid.Parse(req.ColumnID)
	if err := colUUID.Scan(req.ColumnID); err != nil {
		http.Error(w, "Invalid column ID", http.StatusBadRequest)
		return
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
		http.Error(w, "Failed to create card", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(card)
}

func (h *BoardHandler) UpdateCard(w http.ResponseWriter, r *http.Request) {

	cardIDStr := r.PathValue("cardID")
	if cardIDStr == "" {
		http.Error(w, "Card ID is required", http.StatusBadRequest)
		return
	}

	var cardUUID uuid.UUID
	if err := cardUUID.Scan(cardIDStr); err != nil {
		http.Error(w, "Invalid card ID format", http.StatusBadRequest)
		return
	}

	var req UpdateCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var estimatedHours pgtype.Numeric
	if req.EstimatedHours != nil {
		estimatedHours.Scan(fmt.Sprintf("%f", *req.EstimatedHours))
	}

	card, err := h.boardService.UpdateCard(r.Context(), service.UpdateCardParams{
		ID:             cardUUID,
		Title:          pgutil.PtrToText(req.Title),
		Description:    pgutil.PtrToText(req.Description),
		DueDate:        pgutil.PtrToDate(req.DueDate),
		AssigneeID:     pgutil.PtrToUUID(req.AssigneeID),
		Priority:       pgutil.PtrToText(req.Priority),
		EstimatedHours: estimatedHours,
	})
	if err != nil {
		log.Printf("UpdateCard error: %v", err)
		http.Error(w, "Failed to update card", http.StatusInternalServerError)
		return
	}

	respondJSON(w, http.StatusOK, card)
}

func (h *BoardHandler) GetCard(w http.ResponseWriter, r *http.Request) {
	// 1. อ่านค่า cardID จาก URL
	cardIDStr := chi.URLParam(r, "cardID")

	// 2. แปลง String เป็น UUID (Best Practice: ตรวจสอบ Format ก่อนไปตี Database)
	cardID, err := uuid.Parse(cardIDStr)
	if err != nil {
		http.Error(w, "Invalid card ID format", http.StatusBadRequest)
		return
	}

	// 3. เรียกใช้ Service เพื่อดึงข้อมูล (ส่ง context ไปด้วยเสมอ)
	card, err := h.boardService.GetCard(r.Context(), cardID)
	if err != nil {
		// Best Practice: แยกประเภทของ Error เพื่อส่ง HTTP Status ให้ถูกต้อง
		if errors.Is(err, sql.ErrNoRows) {
			// ถ้าหาไม่เจอ ให้ส่ง 404 Not Found
			http.Error(w, "Card not found", http.StatusNotFound)
			return
		}
		// ถ้าเป็น Error อื่นๆ จากระบบ ให้ส่ง 500
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// 4. ตั้งค่า Header ว่าข้อมูลที่จะส่งกลับไปเป็น JSON
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)

	// 5. แปลง Struct card เป็น JSON แล้วส่งกลับ
	if err := json.NewEncoder(w).Encode(card); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}