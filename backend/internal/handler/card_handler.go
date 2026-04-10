package handler

import (
	"database/sql"
	"errors"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/util"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func (h *BoardHandler) CreateCard(w http.ResponseWriter, r *http.Request) error {
	var req dto.CreateCardRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	if _, err := uuid.Parse(req.ColumnID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid column ID", err)
	}

	userIDStr, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userIDStr == "" {
		return httputil.NewAPIError(http.StatusUnauthorized, "Unauthorized", nil)
	}

	card, err := h.boardService.CreateCard(r.Context(), db.CreateCardParams{
		ColumnID:   req.ColumnID,
		Title:      req.Title,
		Position:   0,
		DueDate:    util.PtrStringToTimePtr(req.DueDate),
		AssigneeID: req.AssigneeID,
		Priority:   req.Priority,
		CreatedBy:  util.StringToPtr(userIDStr),
	})
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to create card", err)
	}

	httputil.RespondJSON(w, http.StatusCreated, card)
	return nil
}

func (h *BoardHandler) UpdateCard(w http.ResponseWriter, r *http.Request) error {
	cardIDStr := chi.URLParam(r, "cardID")
	if _, err := uuid.Parse(cardIDStr); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid card ID format", err)
	}

	var req dto.UpdateCardRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	var title string
	if req.Title != nil {
		title = *req.Title
	}

	card, err := h.boardService.UpdateCard(r.Context(), service.UpdateCardParams{
		ID:             cardIDStr,
		Title:          title,
		Description:    req.Description,
		DueDate:        util.PtrStringToTimePtr(req.DueDate),
		AssigneeID:     req.AssigneeID,
		Priority:       req.Priority,
		EstimatedHours: req.EstimatedHours,
	})
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to update card", err)
	}

	httputil.RespondJSON(w, http.StatusOK, card)
	return nil
}

func (h *BoardHandler) GetCard(w http.ResponseWriter, r *http.Request) error {
	cardIDStr := chi.URLParam(r, "cardID")
	if _, err := uuid.Parse(cardIDStr); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid card ID format", err)
	}

	card, err := h.boardService.GetCard(r.Context(), cardIDStr)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Card not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Internal server error", err)
	}

	httputil.RespondJSON(w, http.StatusOK, card)
	return nil
}
