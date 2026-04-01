package handler

import (
	"log"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
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

func (h *BoardHandler) GetAllBoards(w http.ResponseWriter, r *http.Request) error {
	boards, err := h.boardService.GetAllBoards(r.Context())
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to fetch boards", err)
	}

	result := make([]dto.BoardSummaryResponse, 0, len(boards))
	for _, b := range boards {
		result = append(result, dto.BoardSummaryResponse{
			ID:    b.ID.String(),
			Title: b.Title,
		})
	}
	httputil.RespondJSON(w, http.StatusOK, result)
	return nil
}

func (h *BoardHandler) GetBoardData(w http.ResponseWriter, r *http.Request) error {
	// ใช้ httputil.GetUUIDParam แทน uuid.Scan เดิม
	boardUUID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID format", err)
	}

	columns, err := h.boardService.GetBoardWithCards(r.Context(), boardUUID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to fetch board data", err)
	}

	httputil.RespondJSON(w, http.StatusOK, toColumnResponses(columns))
	return nil
}

func (h *BoardHandler) CreateBoard(w http.ResponseWriter, r *http.Request) error {
	var req dto.CreateBoardRequest
	// ใช้ decodeJSON แทน json.NewDecoder
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Invalid request body", err)
	}

	userIDStr, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userIDStr == "" {
		return httputil.NewAPIError(http.StatusUnauthorized, "Unauthorized", nil)
	}

	ownerUUID, err := uuid.Parse(userIDStr)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Invalid user ID in token", err)
	}

	boardID, err := h.boardService.CreateBoard(r.Context(), req.Title, ownerUUID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to create board", err)
	}

	httputil.RespondJSON(w, http.StatusCreated, map[string]string{"id": boardID.String()})
	return nil
}

func (h *BoardHandler) UpdateBoard(w http.ResponseWriter, r *http.Request) error{
	boardUUID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
	return httputil.NewAPIError(http.StatusInternalServerError, "Invalid or missing board ID", err)
	}

	var req dto.UpdateBoardRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Invalid request body", err)
	}

	updatedBoard, err := h.boardService.UpdateBoard(r.Context(), boardUUID, req.Title, req.Budget)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to update board", err)
	}

	httputil.RespondJSON(w, http.StatusOK, updatedBoard)
    return nil
}

func (h *BoardHandler) MoveToTrash(w http.ResponseWriter, r *http.Request) error {

	boardUUID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID format", err)
	}

	if err := h.boardService.MoveBoardToTrash(r.Context(), boardUUID); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError,"Failed to move board to trash" , err)
	}

	w.WriteHeader(http.StatusNoContent)
    return nil
}

func (h *BoardHandler) GetTrash(w http.ResponseWriter, r *http.Request) error{
	boards, err := h.boardService.GetTrashedBoards(r.Context())
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError,"Failed to get trash", err)

	}

	httputil.RespondJSON(w, http.StatusOK, boards)
    return nil
}

func (h *BoardHandler) HardDelete(w http.ResponseWriter, r *http.Request) error{
	// ของเดิมมีบักไม่ได้เช็ค Error ตอน Scan ตอนนี้แก้ให้ปลอดภัยแล้ว
	boardUUID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID format", err)
	}

	if err := h.boardService.HardDeleteBoard(r.Context(), boardUUID); err != nil {
		log.Printf("HardDelete error: %v", err)
		return httputil.NewAPIError(http.StatusInternalServerError, "Delete failed", err)
	}

	w.WriteHeader(http.StatusNoContent)
    return nil
}

func toColumnResponses(columns []service.ColumnData) []dto.ColumnResponse {
	result := make([]dto.ColumnResponse, 0, len(columns))
	for _, col := range columns {
		cards := make([]dto.CardResponse, 0, len(col.Cards))
		for _, card := range col.Cards {
			cards = append(cards, dto.CardResponse{
				ID:           card.ID.String(),
				ColumnID:     card.ColumnID.String(),
				Title:        card.Title,
				Description:  card.Description,
				Position:     card.Position,
				DueDate:      timePtrToStrPtr(card.DueDate),
				AssigneeID:   uuidPtrToStrPtr(card.AssigneeID),
				AssigneeName: card.AssigneeName,
				Priority:     card.Priority,
			})
		}
		result = append(result, dto.ColumnResponse{
			ID:       col.ID.String(),
			Title:    col.Title,
			Position: col.Position,
			Cards:    cards,
		})
	}
	return result
}

func timePtrToStrPtr(t *time.Time) *string {
	if t == nil {
		return nil
	}
	// แปลงรูปแบบเวลาเป็นมาตรฐาน ISO 8601 (RFC3339)
	val := t.Format("2006-01-02T15:04:05Z07:00") 
	return &val
}

// Helper แปลง *uuid.UUID เป็น *string สำหรับ JSON
func uuidPtrToStrPtr(u *uuid.UUID) *string {
	if u == nil {
		return nil
	}
	val := u.String()
	return &val
}