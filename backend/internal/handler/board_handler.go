package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
)

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
	boardService *service.BoardService
}
type CreateCardRequest struct {
	ColumnID string `json:"column_id"`
	Title    string `json:"title"`
}
type CreateBoardRequest struct {
	Title string `json:"title"`
}
type BoardSummaryResponse struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

func NewBoardHandler(boardService *service.BoardService) *BoardHandler {
	return &BoardHandler{
		boardService: boardService,
	}
}

func (h *BoardHandler) GetBoardData(w http.ResponseWriter, r *http.Request) {
	// w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	boardIDStr := r.PathValue("boardID")
	if boardIDStr == "" {
		http.Error(w, "Board ID is required", http.StatusBadRequest)
		return
	}
	var boardUUID pgtype.UUID
	err := boardUUID.Scan(boardIDStr)
	if err != nil {
		http.Error(w, "Invalid board ID format", http.StatusBadRequest)
		return
	}
	// ใช้ h.queries ที่ถูก Inject เข้ามา
	columns, err := h.boardService.GetColumnsByBoardID(r.Context(), boardUUID)
	if err != nil {
		http.Error(w, "Failed to fetch columns", http.StatusInternalServerError)
		return
	}
	var columnIDs []pgtype.UUID
	for _, col := range columns {
		columnIDs = append(columnIDs, col.ID)
	}
	// เปลี่ยนจาก h.queries เป็น h.boardService
	cards, err := h.boardService.GetCardsByColumnIDs(r.Context(), columnIDs)
	if err != nil {
		log.Printf("Error fetching cards: %v", err)
	}
	result := make([]ColumnResponse, 0)
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
	card, err := h.boardService.CreateCard(r.Context(), db.CreateCardParams{
		ColumnID: colUUID,
		Title:    req.Title,
		Position: 0, 
	})
	if err != nil {
		log.Printf("Error creating card: %v", err)
		http.Error(w, "Failed to create card", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(card)
}

func (h *BoardHandler) GetAllBoards(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	boards, err := h.boardService.GetAllBoards(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch boards", http.StatusInternalServerError)
		return
	}
	var result []BoardSummaryResponse
	for _, b := range boards {
		result = append(result, BoardSummaryResponse{
			ID:    b.ID.String(),
			Title: b.Title,
		})
	}
	json.NewEncoder(w).Encode(result)
}

func (h *BoardHandler) CreateBoard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}
	var req CreateBoardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	// เรียกใช้งานผ่าน Service (Logic การสร้างคอลัมน์ถูกซ่อนไว้)
	boardID, err := h.boardService.CreateBoard(r.Context(), req.Title)
	if err != nil {
		http.Error(w, "Failed to create board", http.StatusInternalServerError)
		return
	}
	json.NewEncoder(w).Encode(map[string]string{
		"id": boardID.String(),
	})
}


func (h *BoardHandler) HandleBoardsRoute(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.GetAllBoards(w, r)
	case http.MethodPost:
		h.CreateBoard(w, r)
	default:
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}