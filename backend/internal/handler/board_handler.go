package handler

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/jackc/pgx/v5/pgtype"
)

type CardResponse struct {
    ID             string  `json:"id"`
    ColumnID       string  `json:"column_id"`
    Title          string  `json:"title"`
    Description    *string `json:"description"`
    Position       float64 `json:"position"`
    DueDate        *string `json:"due_date"`
    EstimatedHours *float64 `json:"estimated_hours"`
    AssigneeID     *string `json:"assignee_id"`
    AssigneeName   *string `json:"assignee_name"`
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
}
type CreateBoardRequest struct {
	Title string `json:"title"`
}
type BoardSummaryResponse struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}
func pgDateToPtr(d pgtype.Date) *string {
    if !d.Valid {
        return nil
    }
    s := d.Time.Format("2006-01-02")
    return &s
}

func pgUUIDToPtr(u pgtype.UUID) *string {
	if !u.Valid {
		return nil
	}
	s := u.String()
	return &s
}

func pgTextToPtr(t pgtype.Text) *string {
	if !t.Valid {
		return nil
	}
	return &t.String
}

func NewBoardHandler(boardService *service.BoardService) *BoardHandler {
	return &BoardHandler{
		boardService: boardService,
	}
}

func (h *BoardHandler) GetBoardData(w http.ResponseWriter, r *http.Request) {
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
	if err := boardUUID.Scan(boardIDStr); err != nil {
		http.Error(w, "Invalid board ID format", http.StatusBadRequest)
		return
	}

	columns, err := h.boardService.GetColumnsByBoardID(r.Context(), boardUUID)
	if err != nil {
		http.Error(w, "Failed to fetch columns", http.StatusInternalServerError)
		return
	}

	columnIDs := make([]pgtype.UUID, len(columns))
	for i, col := range columns {
		columnIDs[i] = col.ID
	}

	cards, err := h.boardService.GetCardsByColumnIDs(r.Context(), columnIDs)
	if err != nil {
		log.Printf("Error fetching cards: %v", err)
		http.Error(w, "Failed to fetch cards", http.StatusInternalServerError)
		return
	}

	// group cards ก่อน แทนที่จะวน loop ซ้อนกัน O(n²)
	cardsByColumn := make(map[pgtype.UUID][]CardResponse)
	for _, card := range cards {
    cardsByColumn[card.ColumnID] = append(cardsByColumn[card.ColumnID], CardResponse{
        ID:           card.ID.String(),
        ColumnID:     card.ColumnID.String(),
        Title:        card.Title,
        Description:  pgTextToPtr(card.Description),
        Position:     card.Position,
        DueDate:      pgDateToPtr(card.DueDate),
        AssigneeID:   pgUUIDToPtr(card.AssigneeID),
        AssigneeName: pgTextToPtr(card.AssigneeName),
    })
}

	result := make([]ColumnResponse, 0, len(columns))
	for _, col := range columns {
		colCards := cardsByColumn[col.ID]
		if colCards == nil {
			colCards = []CardResponse{}
		}
		result = append(result, ColumnResponse{
			ID:       col.ID.String(),
			Title:    col.Title,
			Position: col.Position,
			Cards:    colCards,
		})
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

	boardIDStr := r.PathValue("boardID")
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
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

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
    boardIDStr := r.PathValue("boardID")
    var boardUUID pgtype.UUID
    boardUUID.Scan(boardIDStr)

    if err := h.boardService.HardDeleteBoard(r.Context(), boardUUID); err != nil {
        http.Error(w, "Delete failed", http.StatusInternalServerError)
        return
    }
    w.WriteHeader(http.StatusNoContent)
}