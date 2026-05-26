// Claim / release handlers for planning items. Lives in its own file so
// planning_handler.go stays focused on session + item CRUD. Permission
// matrix is simpler than comments: any board member can claim; release is
// own-only with a board-owner/manager force-release path.
//
// Activity events are logged after the mutation commits, mirroring the
// rest of the planning routes (best-effort audit — a logger failure does
// not bubble up).
package handler

import (
	"errors"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/core"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
)

// ClaimItem is the POST /api/planning/items/:itemID/claim endpoint.
// Returns 409 if another user holds the claim — the row exists and is
// fine, the caller just wasn't first. 404 only for the not-a-member /
// item-not-found cases (anti-enumeration).
func (h *PlanningHandler) ClaimItem(w http.ResponseWriter, r *http.Request) error {
	itemID := chi.URLParam(r, "itemID")
	if _, err := uuid.Parse(itemID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid item ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	current, err := h.planning.GetItem(r.Context(), itemID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to load item", err)
	}
	boardID, err := h.planning.GetSessionBoardID(r.Context(), current.SessionID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to resolve board", err)
	}
	if _, apiErr := h.requireMembership(r, boardID, userID); apiErr != nil {
		return apiErr
	}
	if current.Status == "promoted" {
		return httputil.NewAPIError(http.StatusConflict, "ส่งเข้า Board แล้ว ไม่ต้อง claim", nil)
	}

	if err := h.planning.ClaimItem(r.Context(), itemID, userID); err != nil {
		if errors.Is(err, service.ErrPlanningItemAlreadyClaimed) {
			return httputil.NewAPIError(http.StatusConflict, "มีคนกำลังดูอยู่", err)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to claim item", err)
	}

	h.recordActivity(r, boardID, userID,
		service.EventPlanningItemClaimed, service.EntityPlanningItem,
		strPtr(current.ID),
		service.PlanningItemClaimedPayload{Title: current.Title, Type: current.Type},
	)

	w.WriteHeader(http.StatusNoContent)
	return nil
}

// ReleaseItem clears the claim. Two modes:
//   - default: the caller is the current claimer ("เลิกดู" button)
//   - force:   the caller is board owner or manager (moderation)
//
// Anything else collapses to 404 to stay consistent with the
// anti-enumeration pattern used elsewhere in the planning routes.
func (h *PlanningHandler) ReleaseItem(w http.ResponseWriter, r *http.Request) error {
	itemID := chi.URLParam(r, "itemID")
	if _, err := uuid.Parse(itemID); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid item ID", err)
	}
	userID, apiErr := userIDFrom(r)
	if apiErr != nil {
		return apiErr
	}
	current, err := h.planning.GetItem(r.Context(), itemID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to load item", err)
	}
	boardID, err := h.planning.GetSessionBoardID(r.Context(), current.SessionID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to resolve board", err)
	}
	role, apiErr := h.requireMembership(r, boardID, userID)
	if apiErr != nil {
		return apiErr
	}

	// No claim exists at all → idempotent no-op (the row's already in the
	// state the caller wanted).
	if current.ClaimedByUserID == nil {
		w.WriteHeader(http.StatusNoContent)
		return nil
	}

	isOwner := *current.ClaimedByUserID == userID
	canForce := role == core.RoleOwner || role == core.RoleManager
	if !isOwner && !canForce {
		// Same shape as "not a member" → no signal about whether the
		// item exists / who holds the claim.
		return httputil.NewAPIError(http.StatusNotFound, "Not found", nil)
	}

	if isOwner {
		if err := h.planning.ReleaseItemAsOwner(r.Context(), itemID, userID); err != nil {
			if errors.Is(err, service.ErrPlanningItemNotClaimedByYou) {
				// Race: someone else just took / released the claim between
				// our GetItem and the UPDATE. Treat as idempotent — the
				// caller wanted "no claim by me", which is the current state.
				w.WriteHeader(http.StatusNoContent)
				return nil
			}
			return httputil.NewAPIError(http.StatusInternalServerError, "Failed to release item", err)
		}
	} else {
		if err := h.planning.ReleaseItemForce(r.Context(), itemID); err != nil {
			return httputil.NewAPIError(http.StatusInternalServerError, "Failed to release item", err)
		}
	}

	h.recordActivity(r, boardID, userID,
		service.EventPlanningItemReleased, service.EntityPlanningItem,
		strPtr(current.ID),
		service.PlanningItemReleasedPayload{Title: current.Title, Type: current.Type},
	)

	w.WriteHeader(http.StatusNoContent)
	return nil
}
