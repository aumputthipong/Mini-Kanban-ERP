package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service/mock"
	"github.com/jackc/pgx/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// validBoardID / validUserID defined in board_handler_test.go (same package).
const (
	validPlanningItemID = "11111111-2222-3333-4444-555555555555"
	validPromotedCardID = "66666666-7777-8888-9999-aaaaaaaaaaaa"
)

// newPromoteTestRig wires the three collaborators a PromoteItem test needs.
// Each test then overrides the specific Fn fields it cares about; methods
// nothing touches stay nil and would panic if invoked, which is the point —
// missing stubs surface loudly rather than silently returning zero values.
func newPromoteTestRig() (*mock.MockPlanningService, *mock.MockBoardService, *mock.MockActivityRecorder, *PlanningHandler) {
	plan := &mock.MockPlanningService{}
	boards := &mock.MockBoardService{
		GetBoardMemberRoleFn: func(ctx context.Context, boardID, userID string) (string, error) {
			return "owner", nil
		},
	}
	act := &mock.MockActivityRecorder{}
	h := NewPlanningHandler(plan, boards, act)
	return plan, boards, act, h
}

func newPromoteRequest(t *testing.T, itemID, userID string) *http.Request {
	t.Helper()
	req := httptest.NewRequest(http.MethodPost, "/planning/items/"+itemID+"/promote", strings.NewReader("{}"))
	req = chiCtx(req, "itemID", itemID)
	return withUserID(req, userID)
}

// ────────────────────────────────────────────────
// PromoteItem — happy path + edge cases
// ────────────────────────────────────────────────

func TestPromoteItem_HappyPath_CreatesCardAndRecordsActivity(t *testing.T) {
	plan, _, act, h := newPromoteTestRig()
	plan.GetItemBoardIDFn = func(ctx context.Context, itemID string) (string, error) {
		return validBoardID, nil
	}
	plan.PromoteItemFn = func(ctx context.Context, itemID, userID string) (db.PlanningItem, db.CreateCardRow, error) {
		return db.PlanningItem{
				ID:     validPlanningItemID,
				Type:   "REQ",
				Title:  "Add Google login",
				Status: "promoted",
			},
			db.CreateCardRow{ID: validPromotedCardID},
			nil
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.PromoteItem)(w, newPromoteRequest(t, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusOK, w.Code)
	var body map[string]any
	require.NoError(t, json.NewDecoder(w.Body).Decode(&body))
	assert.Equal(t, validPromotedCardID, body["card_id"])

	// Activity assertion — single planning.item_promoted row, payload
	// carries the new card_id so the feed can deep-link.
	require.Len(t, act.Calls, 1)
	call := act.Calls[0]
	assert.Equal(t, service.EventPlanningItemPromoted, call.EventType)
	assert.Equal(t, service.EntityPlanningItem, call.EntityType)
	require.NotNil(t, call.EntityID)
	assert.Equal(t, validPlanningItemID, *call.EntityID)
	payload, ok := call.Payload.(service.PlanningItemPromotedPayload)
	require.True(t, ok, "payload should be PlanningItemPromotedPayload")
	assert.Equal(t, "REQ", payload.Type)
	assert.Equal(t, "Add Google login", payload.Title)
	assert.Equal(t, validPromotedCardID, payload.ToCardID)
}

func TestPromoteItem_AlreadyPromoted_Returns409(t *testing.T) {
	plan, _, act, h := newPromoteTestRig()
	plan.GetItemBoardIDFn = func(ctx context.Context, itemID string) (string, error) {
		return validBoardID, nil
	}
	plan.PromoteItemFn = func(ctx context.Context, itemID, userID string) (db.PlanningItem, db.CreateCardRow, error) {
		return db.PlanningItem{}, db.CreateCardRow{}, service.ErrPlanningItemAlreadyPromoted
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.PromoteItem)(w, newPromoteRequest(t, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusConflict, w.Code)
	// No activity row should be written on failure — we don't want the
	// audit feed showing a "promoted" event when the second attempt was
	// rejected.
	assert.Empty(t, act.Calls)
}

func TestPromoteItem_DroppedItem_Returns422(t *testing.T) {
	plan, _, act, h := newPromoteTestRig()
	plan.GetItemBoardIDFn = func(ctx context.Context, itemID string) (string, error) {
		return validBoardID, nil
	}
	plan.PromoteItemFn = func(ctx context.Context, itemID, userID string) (db.PlanningItem, db.CreateCardRow, error) {
		return db.PlanningItem{}, db.CreateCardRow{}, service.ErrPlanningItemDropped
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.PromoteItem)(w, newPromoteRequest(t, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
	assert.Contains(t, w.Body.String(), "dropped")
	assert.Empty(t, act.Calls)
}

func TestPromoteItem_NoTodoColumn_Returns422(t *testing.T) {
	plan, _, act, h := newPromoteTestRig()
	plan.GetItemBoardIDFn = func(ctx context.Context, itemID string) (string, error) {
		return validBoardID, nil
	}
	plan.PromoteItemFn = func(ctx context.Context, itemID, userID string) (db.PlanningItem, db.CreateCardRow, error) {
		return db.PlanningItem{}, db.CreateCardRow{}, service.ErrPlanningNoTodoColumn
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.PromoteItem)(w, newPromoteRequest(t, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusUnprocessableEntity, w.Code)
	assert.Contains(t, w.Body.String(), "TODO")
	assert.Empty(t, act.Calls)
}

func TestPromoteItem_NotMember_Returns404(t *testing.T) {
	plan, boards, act, h := newPromoteTestRig()
	plan.GetItemBoardIDFn = func(ctx context.Context, itemID string) (string, error) {
		return validBoardID, nil
	}
	// Membership lookup returns pgx.ErrNoRows when the user isn't a member;
	// the handler must surface this as 404 (anti-enumeration), not 403.
	boards.GetBoardMemberRoleFn = func(ctx context.Context, boardID, userID string) (string, error) {
		return "", pgx.ErrNoRows
	}

	w := httptest.NewRecorder()
	httputil.MakeHandler(h.PromoteItem)(w, newPromoteRequest(t, validPlanningItemID, validUserID))

	assert.Equal(t, http.StatusNotFound, w.Code)
	assert.Empty(t, act.Calls)
}
