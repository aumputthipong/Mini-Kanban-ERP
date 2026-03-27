package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)
 // 3. สร้าง Struct ชั่วคราว (DTO) เพื่อประกอบร่าง Column และ Card เข้าด้วยกันก่อนส่งเป็น JSON
type CardResponse struct {
	ID       string  `json:"id"`
	ColumnID string  `json:"column_id"`
	Title    string  `json:"title"`
	Position float64 `json:"position"`
}

type ColumnResponse struct {
	ID       string         `json:"id"`
	Title    string         `json:"title"`
	Position float64        `json:"position"`
	Cards    []CardResponse `json:"cards"`
}

type BoardHandler struct {
	queries *db.Queries
	frontendURL string
}

type CreateCardRequest struct {
	ColumnID string `json:"column_id"`
	Title    string `json:"title"`
}

// NewBoardHandler คือ Constructor สำหรับสร้าง BoardHandler
func NewBoardHandler(q *db.Queries, frontendURL string) *BoardHandler {
	return &BoardHandler{
		queries: q,
		frontendURL: frontendURL,
	}
}

func (h *BoardHandler) GetBoardData(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", h.frontendURL)
	w.Header().Set("Content-Type", "application/json")

	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	boardIDStr := "452ae618-9e69-49f5-88a9-47728a5f17ac"

	var boardUUID pgtype.UUID
	err := boardUUID.Scan(boardIDStr)
	if err != nil {
		http.Error(w, "Invalid board ID format", http.StatusBadRequest)
		return
	}

	// ใช้ h.queries ที่ถูก Inject เข้ามา
	columns, err := h.queries.GetColumnsByBoardID(r.Context(), boardUUID)
	if err != nil {
		http.Error(w, "Failed to fetch columns", http.StatusInternalServerError)
		return
	}

	var columnIDs []pgtype.UUID
	for _, col := range columns {
		columnIDs = append(columnIDs, col.ID)
	}

	cards, err := h.queries.GetCardsByColumnIDs(r.Context(), columnIDs)
	if err != nil {
		log.Printf("Error fetching cards: %v", err)
	}

	var result []ColumnResponse
	for _, col := range columns {
		colRes := ColumnResponse{
			ID:       col.ID.String(),
			Title:    col.Title,
			Position: col.Position,
			Cards:    []CardResponse{},
		}

		for _, card := range cards {
			if card.ColumnID == col.ID {
				colRes.Cards = append(colRes.Cards, CardResponse{
					ID:       card.ID.String(),
					ColumnID: card.ColumnID.String(),
					Title:    card.Title,
					Position: card.Position,
				})
			}
		}
		result = append(result, colRes)
	}

	json.NewEncoder(w).Encode(result)
}


func (h *BoardHandler) CreateCard(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", h.frontendURL)
	w.Header().Set("Access-Control-Allow-Methods", "POST, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type")
	w.Header().Set("Content-Type", "application/json")

	// จัดการ Preflight Request ของ Browser
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req CreateCardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	var colUUID pgtype.UUID
	if err := colUUID.Scan(req.ColumnID); err != nil {
		http.Error(w, "Invalid column ID", http.StatusBadRequest)
		return
	}

	// สร้างการ์ดใหม่ใน Database (กำหนด position เป็น 0 หรือค่าเริ่มต้นไปก่อน)
	card, err := h.queries.CreateCard(r.Context(), db.CreateCardParams{
		ColumnID: colUUID,
		Title:    req.Title,
		Position: 0, // ในระบบจริงควรคำนวณหาตำแหน่งสุดท้ายของคอลัมน์
	})

	if err != nil {
		log.Printf("Error creating card: %v", err)
		http.Error(w, "Failed to create card", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(card)
}