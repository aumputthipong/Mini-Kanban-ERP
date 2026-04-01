package handler

import (
	"log"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/pgutil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/google/uuid"
)
type BoardHandler struct {
	boardService *service.BoardService
}

func NewBoardHandler(boardService *service.BoardService) *BoardHandler {
	return &BoardHandler{
		boardService: boardService,
	}
}

func (h *BoardHandler) HandleBoardsRoute(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		h.GetAllBoards(w, r)
	case http.MethodPost:
		h.CreateBoard(w, r)
	default:
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
	}
}



func (h *BoardHandler) GetAllBoards(w http.ResponseWriter, r *http.Request) {
	boards, err := h.boardService.GetAllBoards(r.Context())
	if err != nil {
		log.Printf("GetAllBoards error: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to fetch boards")
		return
	}

	result := make([]BoardSummaryResponse, 0, len(boards))
	for _, b := range boards {
		result = append(result, BoardSummaryResponse{
			ID:    b.ID.String(),
			Title: b.Title,
		})
	}
	respondJSON(w, http.StatusOK, result)
}


func (h *BoardHandler) GetBoardData(w http.ResponseWriter, r *http.Request) {
	// ใช้ getUUIDParam แทน uuid.Scan เดิม
	boardUUID, err := getUUIDParam(r, "boardID")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid board ID format")
		return
	}

	columns, err := h.boardService.GetBoardWithCards(r.Context(), boardUUID)
	if err != nil {
		log.Printf("GetBoardWithCards error: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to fetch board data")
		return
	}

	respondJSON(w, http.StatusOK, toColumnResponses(columns))
}

func (h *BoardHandler) CreateBoard(w http.ResponseWriter, r *http.Request) {
	var req CreateBoardRequest
	// ใช้ decodeJSON แทน json.NewDecoder
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	userIDStr, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userIDStr == "" {
		respondError(w, http.StatusUnauthorized, "Unauthorized")
		return
	}

	// เนื่องจาก userIDStr มาจาก Token ซึ่งเรามั่นใจว่าเป็น string เราใช้ getUUIDParam ไม่ได้
	// ให้ใช้ uuid.Parse() ตรงๆ เหมือนใน auth_handler
	ownerUUID, err := uuid.Parse(userIDStr)
	if err != nil {
		respondError(w, http.StatusInternalServerError, "Invalid user ID in token")
		return
	}

	boardID, err := h.boardService.CreateBoard(r.Context(), req.Title, ownerUUID)
	if err != nil {
		log.Printf("CreateBoard error: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to create board")
		return
	}

	respondJSON(w, http.StatusCreated, map[string]string{"id": boardID.String()})
}

func (h *BoardHandler) UpdateBoard(w http.ResponseWriter, r *http.Request) {
	boardUUID, err := getUUIDParam(r, "boardID")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid or missing board ID")
		return
	}

	var req UpdateBoardRequest
	if err := decodeJSON(r, &req); err != nil {
		respondError(w, http.StatusBadRequest, "Invalid request body")
		return
	}

	updatedBoard, err := h.boardService.UpdateBoard(r.Context(), boardUUID, req.Title, req.Budget)
	if err != nil {
		log.Printf("Failed to update board: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to update board")
		return
	}

	respondJSON(w, http.StatusOK, updatedBoard)
}




func (h *BoardHandler) MoveToTrash(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodDelete {
		respondError(w, http.StatusMethodNotAllowed, "Method not allowed")
		return
	}

	boardUUID, err := getUUIDParam(r, "boardID")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid board ID format")
		return
	}

	if err := h.boardService.MoveBoardToTrash(r.Context(), boardUUID); err != nil {
		log.Printf("MoveToTrash error: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to move board to trash")
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (h *BoardHandler) GetTrash(w http.ResponseWriter, r *http.Request) {
	boards, err := h.boardService.GetTrashedBoards(r.Context())
	if err != nil {
		log.Printf("GetTrash error: %v", err)
		respondError(w, http.StatusInternalServerError, "Failed to get trash")
		return
	}

	respondJSON(w, http.StatusOK, boards)
}


// ลบถาวร
func (h *BoardHandler) HardDelete(w http.ResponseWriter, r *http.Request) {
	// ของเดิมมีบักไม่ได้เช็ค Error ตอน Scan ตอนนี้แก้ให้ปลอดภัยแล้ว
	boardUUID, err := getUUIDParam(r, "boardID")
	if err != nil {
		respondError(w, http.StatusBadRequest, "Invalid board ID format")
		return
	}

	if err := h.boardService.HardDeleteBoard(r.Context(), boardUUID); err != nil {
		log.Printf("HardDelete error: %v", err)
		respondError(w, http.StatusInternalServerError, "Delete failed")
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
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