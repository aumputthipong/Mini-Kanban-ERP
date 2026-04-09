package handler

import (
	"log"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/mapper"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/google/uuid"
)

type BoardHandler struct {
	boardService service.BoardServicer
}

func NewBoardHandler(boardService service.BoardServicer) *BoardHandler {
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
			ID:    b.ID,
			Title: b.Title,
		})
	}
	httputil.RespondJSON(w, http.StatusOK, result)
	return nil
}

func (h *BoardHandler) GetBoardData(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID format", err)
	}

	columns, err := h.boardService.GetBoardWithCards(r.Context(), boardID)
	if err != nil {
		// 🌟 1. เพิ่มบรรทัดนี้เพื่อพิมพ์ Error จริงๆ ออกมาที่ Terminal
		log.Printf("👉 [DB ERROR] GetBoardWithCards failed for board %s: %v\n", boardID, err)

		// 🌟 2. return กลับไปให้ Frontend ตามปกติ
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to fetch board data", err)
	}

	httputil.RespondJSON(w, http.StatusOK, mapper.ToColumnResponses(columns))
	return nil
}
func (h *BoardHandler) CreateBoard(w http.ResponseWriter, r *http.Request) error {
	var req dto.CreateBoardRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	userIDStr, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userIDStr == "" {
		return httputil.NewAPIError(http.StatusUnauthorized, "Unauthorized", nil)
	}
	// validate UUID format ของ userID จาก token
	if _, err := uuid.Parse(userIDStr); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Invalid user ID in token", err)
	}

	boardID, err := h.boardService.CreateBoard(r.Context(), req.Title, userIDStr)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to create board", err)
	}

	httputil.RespondJSON(w, http.StatusCreated, map[string]string{"id": boardID})
	return nil
}

func (h *BoardHandler) UpdateBoard(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid or missing board ID", err)
	}

	var req dto.UpdateBoardRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	updatedBoard, err := h.boardService.UpdateBoard(r.Context(), boardID, req.Title, req.Budget)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to update board", err)
	}

	httputil.RespondJSON(w, http.StatusOK, updatedBoard)
	return nil
}

func (h *BoardHandler) MoveToTrash(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID format", err)
	}

	if err := h.boardService.MoveBoardToTrash(r.Context(), boardID); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to move board to trash", err)
	}

	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (h *BoardHandler) GetTrash(w http.ResponseWriter, r *http.Request) error {
	boards, err := h.boardService.GetTrashedBoards(r.Context())
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to get trash", err)
	}

	httputil.RespondJSON(w, http.StatusOK, mapper.ToTrashedBoardDTOs(boards))
	return nil
}

func (h *BoardHandler) HardDelete(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID format", err)
	}

	if err := h.boardService.HardDeleteBoard(r.Context(), boardID); err != nil {
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
				ID:                card.ID,
				ColumnID:          card.ColumnID,
				Title:             card.Title,
				Description:       card.Description,
				Position:          card.Position,
				DueDate:           timePtrToStrPtr(card.DueDate),
				EstimatedHours:    card.EstimatedHours,
				AssigneeID:        card.AssigneeID,
				AssigneeName:      card.AssigneeName,
				Priority:          card.Priority,
				IsDone:            card.IsDone,
				CompletedAt:       timePtrToStrPtr(card.CompletedAt),
				CreatedBy:         card.CreatedBy,
				TotalSubtasks:     card.TotalSubtasks,
				CompletedSubtasks: card.CompletedSubtasks,
			})
		}
		result = append(result, dto.ColumnResponse{
			ID:       col.ID,
			Title:    col.Title,
			Position: col.Position,
			Category: col.Category,
			Cards:    cards,
		})
	}
	return result
}

// timePtrToStrPtr แปลง *time.Time เป็น *string สำหรับ JSON response
func timePtrToStrPtr(t *time.Time) *string {
	if t == nil {
		return nil
	}
	val := t.Format("2006-01-02T15:04:05Z07:00")
	return &val
}
