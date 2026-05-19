// internal/handler/planning_handler.go
//
// Thin REST surface over PlanningService. Auth is handled by the chi route
// group (RequireAuth + RequireBoardMember). Endpoints scope by either
// boardID (list/create session) or by sessionID/itemID — for the latter we
// resolve the owning board via the service and re-check membership so a
// session/item can't be touched cross-board.
package handler

import (
	"errors"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/core"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

type PlanningHandler struct {
	planning *service.PlanningService
	boards   service.BoardServicer
}

func NewPlanningHandler(p *service.PlanningService, b service.BoardServicer) *PlanningHandler {
	return &PlanningHandler{planning: p, boards: b}
}

// requireMembership re-checks board membership when the URL only carries a
// session/item ID — same 404-not-403 anti-enumeration pattern as the card
// handlers (see card_handler.go).
func (h *PlanningHandler) requireMembership(r *http.Request, boardID, userID string) (core.BoardRole, *httputil.APIError) {
	role, err := h.boards.GetBoardMemberRole(r.Context(), boardID, userID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return "", httputil.NewAPIError(http.StatusInternalServerError, "Failed to check board access", err)
	}
	return core.BoardRole(role), nil
}

func userIDFrom(r *http.Request) (string, *httputil.APIError) {
	id, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || id == "" {
		return "", httputil.NewAPIError(http.StatusUnauthorized, "Unauthorized", nil)
	}
	return id, nil
}

func ptrTimeToString(t *time.Time) *string {
	if t == nil {
		return nil
	}
	s := t.Format(time.RFC3339)
	return &s
}

func sessionRowToSummary(r db.ListPlanningSessionsByBoardRow) dto.PlanningSessionSummary {
	return dto.PlanningSessionSummary{
		ID:            r.ID,
		BoardID:       r.BoardID,
		Title:         r.Title,
		Label:         r.Label,
		MeetingAt:     ptrTimeToString(r.MeetingAt),
		CreatedAt:     r.CreatedAt.Format(time.RFC3339),
		UpdatedAt:     r.UpdatedAt.Format(time.RFC3339),
		ReqCount:      r.ReqCount,
		DecCount:      r.DecCount,
		QCount:        r.QCount,
		PromotedCount: r.PromotedCount,
		DroppedCount:  r.DroppedCount,
	}
}

func itemToResponse(it db.PlanningItem) dto.PlanningItemResponse {
	return dto.PlanningItemResponse{
		ID:               it.ID,
		SessionID:        it.SessionID,
		Type:             it.Type,
		Title:            it.Title,
		Description:      it.Description,
		Status:           it.Status,
		PromotedToCardID: it.PromotedToCardID,
		Position:         it.Position,
		CreatedAt:        it.CreatedAt.Format(time.RFC3339),
	}
}

// ─── Sessions ──────────────────────────────────────────────────────────────

func (h *PlanningHandler) ListSessions(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}
	rows, err := h.planning.ListSessionsByBoard(r.Context(), boardID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to list sessions", err)
	}
	out := make([]dto.PlanningSessionSummary, len(rows))
	for i, row := range rows {
		out[i] = sessionRowToSummary(row)
	}
	httputil.RespondJSON(w, http.StatusOK, out)
	return nil
}

func (h *PlanningHandler) CreateSession(w http.ResponseWriter, r *http.Request) error {
	boardID, err := httputil.GetUUIDParam(r, "boardID")
	if err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid board ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	var req dto.CreatePlanningSessionRequest
	if err := httputil.DecodeAndValidate(r, &req); err != nil {
		return err
	}
	sess, err := h.planning.CreateSession(r.Context(), boardID, req.Title, req.Label, req.MeetingAt, userID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to create session", err)
	}
	httputil.RespondJSON(w, http.StatusCreated, dto.PlanningSessionSummary{
		ID:        sess.ID,
		BoardID:   sess.BoardID,
		Title:     sess.Title,
		Label:     sess.Label,
		MeetingAt: ptrTimeToString(sess.MeetingAt),
		CreatedAt: sess.CreatedAt.Format(time.RFC3339),
		UpdatedAt: sess.UpdatedAt.Format(time.RFC3339),
	})
	return nil
}

func (h *PlanningHandler) GetSession(w http.ResponseWriter, r *http.Request) error {
	sessionID := chi.URLParam(r, "sessionID")
	if _, err := uuid.Parse(sessionID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid session ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	sess, err := h.planning.GetSession(r.Context(), sessionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to load session", err)
	}
	if _, apiErr := h.requireMembership(r, sess.BoardID, userID); apiErr != nil {
		return apiErr
	}
	items, err := h.planning.ListItems(r.Context(), sessionID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to list items", err)
	}
	itemDTOs := make([]dto.PlanningItemResponse, len(items))
	for i, it := range items {
		itemDTOs[i] = itemToResponse(it)
	}
	httputil.RespondJSON(w, http.StatusOK, dto.PlanningSessionDetail{
		ID:        sess.ID,
		BoardID:   sess.BoardID,
		Title:     sess.Title,
		Label:     sess.Label,
		MeetingAt: ptrTimeToString(sess.MeetingAt),
		CreatedAt: sess.CreatedAt.Format(time.RFC3339),
		UpdatedAt: sess.UpdatedAt.Format(time.RFC3339),
		Items:     itemDTOs,
	})
	return nil
}

func (h *PlanningHandler) UpdateSession(w http.ResponseWriter, r *http.Request) error {
	sessionID := chi.URLParam(r, "sessionID")
	if _, err := uuid.Parse(sessionID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid session ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	boardID, err := h.planning.GetSessionBoardID(r.Context(), sessionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to resolve board", err)
	}
	if _, apiErr := h.requireMembership(r, boardID, userID); apiErr != nil {
		return apiErr
	}
	var req dto.UpdatePlanningSessionRequest
	if err := httputil.DecodeAndValidate(r, &req); err != nil {
		return err
	}
	sess, err := h.planning.UpdateSession(r.Context(), sessionID, req.Title, req.Label, req.MeetingAt)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to update session", err)
	}
	httputil.RespondJSON(w, http.StatusOK, dto.PlanningSessionSummary{
		ID:        sess.ID,
		BoardID:   sess.BoardID,
		Title:     sess.Title,
		Label:     sess.Label,
		MeetingAt: ptrTimeToString(sess.MeetingAt),
		CreatedAt: sess.CreatedAt.Format(time.RFC3339),
		UpdatedAt: sess.UpdatedAt.Format(time.RFC3339),
	})
	return nil
}

func (h *PlanningHandler) DeleteSession(w http.ResponseWriter, r *http.Request) error {
	sessionID := chi.URLParam(r, "sessionID")
	if _, err := uuid.Parse(sessionID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid session ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	boardID, err := h.planning.GetSessionBoardID(r.Context(), sessionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to resolve board", err)
	}
	if _, apiErr := h.requireMembership(r, boardID, userID); apiErr != nil {
		return apiErr
	}
	if err := h.planning.DeleteSession(r.Context(), sessionID); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to delete session", err)
	}
	w.WriteHeader(http.StatusNoContent)
	return nil
}

// ─── Items ─────────────────────────────────────────────────────────────────

func (h *PlanningHandler) CreateItem(w http.ResponseWriter, r *http.Request) error {
	sessionID := chi.URLParam(r, "sessionID")
	if _, err := uuid.Parse(sessionID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid session ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	boardID, err := h.planning.GetSessionBoardID(r.Context(), sessionID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to resolve board", err)
	}
	if _, apiErr := h.requireMembership(r, boardID, userID); apiErr != nil {
		return apiErr
	}
	var req dto.CreatePlanningItemRequest
	if err := httputil.DecodeAndValidate(r, &req); err != nil {
		return err
	}
	item, err := h.planning.CreateItem(r.Context(), sessionID, req.Type, req.Title, req.Description)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to create item", err)
	}
	httputil.RespondJSON(w, http.StatusCreated, itemToResponse(item))
	return nil
}

func (h *PlanningHandler) UpdateItem(w http.ResponseWriter, r *http.Request) error {
	itemID := chi.URLParam(r, "itemID")
	if _, err := uuid.Parse(itemID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid item ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	boardID, err := h.planning.GetItemBoardID(r.Context(), itemID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to resolve board", err)
	}
	if _, apiErr := h.requireMembership(r, boardID, userID); apiErr != nil {
		return apiErr
	}
	var req dto.UpdatePlanningItemRequest
	if err := httputil.DecodeAndValidate(r, &req); err != nil {
		return err
	}
	item, err := h.planning.UpdateItem(r.Context(), itemID, req.Type, req.Title, req.Description, req.Status, req.Position)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to update item", err)
	}
	httputil.RespondJSON(w, http.StatusOK, itemToResponse(item))
	return nil
}

func (h *PlanningHandler) DeleteItem(w http.ResponseWriter, r *http.Request) error {
	itemID := chi.URLParam(r, "itemID")
	if _, err := uuid.Parse(itemID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid item ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	boardID, err := h.planning.GetItemBoardID(r.Context(), itemID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to resolve board", err)
	}
	if _, apiErr := h.requireMembership(r, boardID, userID); apiErr != nil {
		return apiErr
	}
	if err := h.planning.DeleteItem(r.Context(), itemID); err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to delete item", err)
	}
	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (h *PlanningHandler) PromoteItem(w http.ResponseWriter, r *http.Request) error {
	itemID := chi.URLParam(r, "itemID")
	if _, err := uuid.Parse(itemID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid item ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	boardID, err := h.planning.GetItemBoardID(r.Context(), itemID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to resolve board", err)
	}
	if _, apiErr := h.requireMembership(r, boardID, userID); apiErr != nil {
		return apiErr
	}
	item, card, err := h.planning.PromoteItem(r.Context(), itemID, userID)
	if err != nil {
		if errors.Is(err, service.ErrPlanningItemAlreadyPromoted) {
			return httputil.NewAPIError(http.StatusConflict, "Item already promoted", err)
		}
		if errors.Is(err, service.ErrPlanningNotFound) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", err)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to promote item", err)
	}
	httputil.RespondJSON(w, http.StatusOK, map[string]any{
		"item":    itemToResponse(item),
		"card_id": card.ID,
	})
	return nil
}
