package handler

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"github.com/go-chi/chi/v5"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/pgutil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
)

type CardResponse struct {
	ID             string   `json:"id"`
	ColumnID       string   `json:"column_id"`
	Title          string   `json:"title"`
	Description    *string  `json:"description"`
	Position       float64  `json:"position"`
	DueDate        *string  `json:"due_date"`
	EstimatedHours *float64 `json:"estimated_hours"`
	AssigneeID     *string  `json:"assignee_id"`
	AssigneeName   *string  `json:"assignee_name"`
	Priority       *string  `json:"priority"`
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
	ColumnID   string  `json:"column_id"`
	Title      string  `json:"title"`
	DueDate    *string `json:"due_date"`
	AssigneeID *string `json:"assignee_id"`
	Priority   *string `json:"priority"`
}
type CreateBoardRequest struct {
	Title string `json:"title"`
}
type BoardSummaryResponse struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type UpdateBoardRequest struct {
	Title  *string  `json:"title"`
	Budget *float64 `json:"budget"`
}

type UpdateCardRequest struct {
    Title          *string  `json:"title"`
    Description    *string  `json:"description"`
    DueDate        *string  `json:"due_date"`
    AssigneeID     *string  `json:"assignee_id"`
    Priority       *string  `json:"priority"`
    EstimatedHours *float64 `json:"estimated_hours"`
}

func NewBoardHandler(boardService *service.BoardService) *BoardHandler {
	return &BoardHandler{
		boardService: boardService,
	}
}

func (h *BoardHandler) GetBoardData(w http.ResponseWriter, r *http.Request) {

	boardIDStr := chi.URLParam(r, "boardID")
	if boardIDStr == "" {
		http.Error(w, "Board ID is required", http.StatusBadRequest)
		return
	}

	var boardUUID pgtype.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		http.Error(w, "Invalid board ID format", http.StatusBadRequest)
		return
	}

	columns, err := h.boardService.GetBoardWithCards(r.Context(), boardUUID)
	if err != nil {
		log.Printf("GetBoardWithCards error: %v", err)
		http.Error(w, "Failed to fetch board data", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(toColumnResponses(columns))
}

func toColumnResponses(columns []service.ColumnData) []ColumnResponse {
	result := make([]ColumnResponse, 0, len(columns))
	for _, col := range columns {
		cards := make([]CardResponse, 0, len(col.Cards))
		for _, card := range col.Cards {
			cards = append(cards, CardResponse{
				ID:           card.ID.String(),
				ColumnID:     card.ColumnID.String(),
				Title:        card.Title,
				Description:  pgutil.TextToPtr(card.Description),
				Position:     card.Position,
				DueDate:      pgutil.DateToPtr(card.DueDate),
				AssigneeID:   pgutil.UUIDToPtr(card.AssigneeID),
				AssigneeName: pgutil.TextToPtr(card.AssigneeName),
				Priority:     pgutil.TextToPtr(card.Priority),
			})
		}
		result = append(result, ColumnResponse{
			ID:       col.ID.String(),
			Title:    col.Title,
			Position: col.Position,
			Cards:    cards,
		})
	}
	return result
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

func (h *BoardHandler) GetAllBoards(w http.ResponseWriter, r *http.Request) {

	boards, err := h.boardService.GetAllBoards(r.Context())
	if err != nil {
		http.Error(w, "Failed to fetch boards", http.StatusInternalServerError)
		return
	}

	result := make([]BoardSummaryResponse, 0, len(boards))
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

func (h *BoardHandler) MoveToTrash(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	boardIDStr := chi.URLParam(r, "boardID")
	if boardIDStr == "" {
		http.Error(w, "Board ID is required", http.StatusBadRequest)
		return
	}

	var boardUUID pgtype.UUID
	if err := boardUUID.Scan(boardIDStr); err != nil {
		http.Error(w, "Invalid board ID format", http.StatusBadRequest)
		return
	}

	if err := h.boardService.MoveBoardToTrash(r.Context(), boardUUID); err != nil {
		http.Error(w, "Failed to move board to trash", http.StatusInternalServerError)
		return
	}

	// ส่ง Status 204 No Content เพื่อบอกว่าลบสำเร็จและไม่มีข้อมูลอะไรต้องส่งกลับ
	w.WriteHeader(http.StatusNoContent)
}

// ดึงรายการในถังขยะ
func (h *BoardHandler) GetTrash(w http.ResponseWriter, r *http.Request) {

	boards, err := h.boardService.GetTrashedBoards(r.Context())
	if err != nil {
		http.Error(w, "Failed to get trash", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(boards); err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

// ลบถาวร
func (h *BoardHandler) HardDelete(w http.ResponseWriter, r *http.Request) {
	boardIDStr := chi.URLParam(r, "boardID")
	var boardUUID pgtype.UUID
	boardUUID.Scan(boardIDStr)

	if err := h.boardService.HardDeleteBoard(r.Context(), boardUUID); err != nil {
		http.Error(w, "Delete failed", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusNoContent)
}

func (h *BoardHandler) UpdateBoard(w http.ResponseWriter, r *http.Request) {
	boardIDStr := chi.URLParam(r, "boardID")
	var boardUUID pgtype.UUID
	boardUUID.Scan(boardIDStr)

	var req UpdateBoardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updatedBoard, err := h.boardService.UpdateBoard(r.Context(), boardUUID, req.Title, req.Budget)
	if err != nil {
		http.Error(w, "Failed to update board", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(updatedBoard)
}
func (h *BoardHandler) UpdateCard(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPatch {
        http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
        return
    }

    cardIDStr := r.PathValue("cardID")
    if cardIDStr == "" {
        http.Error(w, "Card ID is required", http.StatusBadRequest)
        return
    }

    var cardUUID pgtype.UUID
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

    writeJSON(w, http.StatusOK, card)
}


func writeJSON(w http.ResponseWriter, status int, v any) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    if err := json.NewEncoder(w).Encode(v); err != nil {
        log.Printf("writeJSON encode error: %v", err)
    }
}
