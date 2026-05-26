package handler

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newClaimRequest(t *testing.T, method, itemID, userID string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(method, "/planning/items/"+itemID+"/claim", nil)
	req = chiCtx(req, "itemID", itemID)
	return withUserID(req, userID)
}

func TestClaimItem_FreeItem_SucceedsAndLogs(t *testing.T) {
	plan, _, act, h := newPromoteTestRig()
	stubItemAndBoard(plan)
	plan.ClaimItemFn = func(ctx context.Context, itemID, userID string) error {
		assert.Equal(t, validPlanningItemID, itemID)
		assert.Equal(t, validUserID, userID)
		return nil
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.ClaimItem)(w, newClaimRequest(t, http.MethodPost, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusNoContent, w.Code)
	require.Len(t, act.Calls, 1)
	assert.Equal(t, service.EventPlanningItemClaimed, act.Calls[0].EventType)
}

func TestClaimItem_AlreadyClaimedByOther_Returns409(t *testing.T) {
	// 409 (not 404) because the row demonstrably exists and the caller's
	// authorisation is fine — they just lost the race. A 404 would leak
	// confusing semantics ("the item went missing"?).
	plan, _, act, h := newPromoteTestRig()
	stubItemAndBoard(plan)
	plan.ClaimItemFn = func(ctx context.Context, itemID, userID string) error {
		return service.ErrPlanningItemAlreadyClaimed
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.ClaimItem)(w, newClaimRequest(t, http.MethodPost, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusConflict, w.Code)
	assert.Empty(t, act.Calls, "failed claim must not produce an audit row")
}

func TestClaimItem_PromotedItem_Returns409(t *testing.T) {
	// Claiming a promoted item is nonsense — the card is the live thing
	// now. 409 keeps the response distinct from "not found" so the UI can
	// surface a clearer message than a generic "not found".
	plan, _, _, h := newPromoteTestRig()
	stubItemAndBoard(plan, func(it *db.PlanningItem) { it.Status = "promoted" })

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.ClaimItem)(w, newClaimRequest(t, http.MethodPost, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusConflict, w.Code)
}

func TestReleaseItem_OwnClaim_SucceedsAndLogs(t *testing.T) {
	plan, _, act, h := newPromoteTestRig()
	owner := validUserID
	stubItemAndBoard(plan, func(it *db.PlanningItem) { it.ClaimedByUserID = &owner })
	plan.ReleaseItemAsOwnerFn = func(ctx context.Context, itemID, userID string) error {
		assert.Equal(t, validUserID, userID)
		return nil
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.ReleaseItem)(w, newClaimRequest(t, http.MethodDelete, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusNoContent, w.Code)
	require.Len(t, act.Calls, 1)
	assert.Equal(t, service.EventPlanningItemReleased, act.Calls[0].EventType)
}

func TestReleaseItem_NotOwnAsMember_Returns404(t *testing.T) {
	// Anti-enumeration: non-owner can't release someone else's claim.
	// 404 (not 403) so the response is indistinguishable from the
	// "item doesn't exist" case — no signal about whether the row exists.
	plan, boards, act, h := newPromoteTestRig()
	other := otherUserID
	stubItemAndBoard(plan, func(it *db.PlanningItem) { it.ClaimedByUserID = &other })
	boards.GetBoardMemberRoleFn = func(ctx context.Context, boardID, userID string) (string, error) {
		return "member", nil
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.ReleaseItem)(w, newClaimRequest(t, http.MethodDelete, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Empty(t, act.Calls)
}

func TestReleaseItem_NotOwnAsManager_ForceReleases(t *testing.T) {
	// Managers/owners can force-release any claim — moderation path,
	// e.g. someone parked a claim on an item and went on PTO.
	plan, boards, act, h := newPromoteTestRig()
	other := otherUserID
	stubItemAndBoard(plan, func(it *db.PlanningItem) { it.ClaimedByUserID = &other })
	boards.GetBoardMemberRoleFn = func(ctx context.Context, boardID, userID string) (string, error) {
		return "manager", nil
	}
	var forced bool
	plan.ReleaseItemForceFn = func(ctx context.Context, itemID string) error {
		forced = true
		return nil
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.ReleaseItem)(w, newClaimRequest(t, http.MethodDelete, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.True(t, forced)
	require.Len(t, act.Calls, 1)
}

func TestReleaseItem_NoClaim_IsIdempotent(t *testing.T) {
	// Calling DELETE on a free item is a no-op — the row is already in
	// the state the caller wanted. Saves the frontend from having to
	// race-check before sending the request.
	plan, _, act, h := newPromoteTestRig()
	stubItemAndBoard(plan) // claim left nil

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.ReleaseItem)(w, newClaimRequest(t, http.MethodDelete, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.Empty(t, act.Calls, "no-op release must not log an event")
}
