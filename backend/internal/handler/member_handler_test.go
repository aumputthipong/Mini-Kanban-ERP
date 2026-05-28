package handler

import (
	"context"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service/mock"
	"github.com/stretchr/testify/assert"
)

// withBoardRole injects a role into context as RequireBoardMember would have
// done upstream — LeaveBoard relies on this to decide whether the caller is
// owner (forbidden to leave).
func withBoardRole(r *http.Request, role string) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), middleware.BoardRoleKey, role))
}

// ────────────────────────────────────────────────
// GetBoardMembers
// ────────────────────────────────────────────────

func TestGetBoardMembers_InvalidBoardID_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{
		GetBoardMembersFn: func(ctx context.Context, boardID string) ([]db.GetBoardMembersRow, error) {
			t.Fatal("must not query DB for malformed board ID")
			return nil, nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodGet, "/boards/bad/members", nil)
	req = chiCtx(req, "boardID", "not-a-uuid")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetBoardMembers)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ────────────────────────────────────────────────
// AddBoardMember
// ────────────────────────────────────────────────

func TestAddBoardMember_Success(t *testing.T) {
	var (
		gotBoardID string
		gotUserID  string
		gotRole    string
	)
	svc := &mock.MockBoardService{
		AddBoardMemberFn: func(ctx context.Context, boardID, userID, role string) error {
			gotBoardID, gotUserID, gotRole = boardID, userID, role
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"user_id":"` + otherUserID + `","role":"member"}`)
	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/members", body)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.AddBoardMember)(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)
	assert.Equal(t, validBoardID, gotBoardID)
	assert.Equal(t, otherUserID, gotUserID)
	assert.Equal(t, "member", gotRole)
}

func TestAddBoardMember_InvalidBoardID_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"user_id":"` + otherUserID + `","role":"member"}`)
	req := httptest.NewRequest(http.MethodPost, "/boards/bad/members", body)
	req = chiCtx(req, "boardID", "not-a-uuid")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.AddBoardMember)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// TestAddBoardMember_InvalidRole_Returns400 — validator's `oneof` blocks
// arbitrary role strings before they hit the DB. AGENTS.md notes that the
// backend is the source of truth for permissions, so this guard is critical:
// a missing validator here would let any string land in the role column.
func TestAddBoardMember_InvalidRole_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{
		AddBoardMemberFn: func(ctx context.Context, boardID, userID, role string) error {
			t.Fatal("must reject unknown role at validator, never call service")
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"user_id":"` + otherUserID + `","role":"superadmin"}`)
	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/members", body)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.AddBoardMember)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAddBoardMember_MissingUserID_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"role":"member"}`)
	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/members", body)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.AddBoardMember)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestAddBoardMember_ServiceError_Returns500(t *testing.T) {
	svc := &mock.MockBoardService{
		AddBoardMemberFn: func(ctx context.Context, boardID, userID, role string) error {
			return errors.New("constraint violation")
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"user_id":"` + otherUserID + `","role":"member"}`)
	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/members", body)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.AddBoardMember)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ────────────────────────────────────────────────
// RemoveBoardMember
// ────────────────────────────────────────────────

func TestRemoveBoardMember_Success(t *testing.T) {
	var gotBoardID, gotUserID string
	svc := &mock.MockBoardService{
		RemoveBoardMemberFn: func(ctx context.Context, boardID, userID string) error {
			gotBoardID, gotUserID = boardID, userID
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodDelete, "/boards/"+validBoardID+"/members/"+otherUserID, nil)
	req = chiCtx(req, "boardID", validBoardID, "userID", otherUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.RemoveBoardMember)(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, validBoardID, gotBoardID)
	assert.Equal(t, otherUserID, gotUserID)
}

func TestRemoveBoardMember_InvalidBoardID_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodDelete, "/boards/bad/members/"+otherUserID, nil)
	req = chiCtx(req, "boardID", "bad", "userID", otherUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.RemoveBoardMember)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRemoveBoardMember_InvalidUserID_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{
		RemoveBoardMemberFn: func(ctx context.Context, boardID, userID string) error {
			t.Fatal("must not call service with invalid user ID")
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodDelete, "/boards/"+validBoardID+"/members/bad", nil)
	req = chiCtx(req, "boardID", validBoardID, "userID", "bad")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.RemoveBoardMember)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestRemoveBoardMember_ServiceError_Returns500(t *testing.T) {
	svc := &mock.MockBoardService{
		RemoveBoardMemberFn: func(ctx context.Context, boardID, userID string) error {
			return errors.New("db down")
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodDelete, "/boards/"+validBoardID+"/members/"+otherUserID, nil)
	req = chiCtx(req, "boardID", validBoardID, "userID", otherUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.RemoveBoardMember)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ────────────────────────────────────────────────
// UpdateMemberRole
// ────────────────────────────────────────────────

func TestUpdateMemberRole_Success(t *testing.T) {
	var gotRole string
	svc := &mock.MockBoardService{
		UpdateMemberRoleFn: func(ctx context.Context, boardID, userID, role string) error {
			gotRole = role
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"role":"manager"}`)
	req := httptest.NewRequest(http.MethodPatch, "/boards/"+validBoardID+"/members/"+otherUserID, body)
	req = chiCtx(req, "boardID", validBoardID, "userID", otherUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.UpdateMemberRole)(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, "manager", gotRole)
}

// TestUpdateMemberRole_PromoteToOwner_Returns400 — owner is a singleton role
// assigned at board creation. Allowing PATCH role=owner would either create
// two owners (breaking the "owner cannot leave" guarantee) or silently demote
// the existing owner. The handler explicitly rejects this; if someone removes
// the guard, this test must scream.
func TestUpdateMemberRole_PromoteToOwner_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{
		UpdateMemberRoleFn: func(ctx context.Context, boardID, userID, role string) error {
			t.Fatal("must reject owner promotion before service call")
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"role":"owner"}`)
	req := httptest.NewRequest(http.MethodPatch, "/boards/"+validBoardID+"/members/"+otherUserID, body)
	req = chiCtx(req, "boardID", validBoardID, "userID", otherUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.UpdateMemberRole)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
	assert.Contains(t, w.Body.String(), "owner")
}

func TestUpdateMemberRole_InvalidRole_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"role":"superadmin"}`)
	req := httptest.NewRequest(http.MethodPatch, "/boards/"+validBoardID+"/members/"+otherUserID, body)
	req = chiCtx(req, "boardID", validBoardID, "userID", otherUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.UpdateMemberRole)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUpdateMemberRole_InvalidUserID_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"role":"member"}`)
	req := httptest.NewRequest(http.MethodPatch, "/boards/"+validBoardID+"/members/bad", body)
	req = chiCtx(req, "boardID", validBoardID, "userID", "bad")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.UpdateMemberRole)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestUpdateMemberRole_ServiceError_Returns500(t *testing.T) {
	svc := &mock.MockBoardService{
		UpdateMemberRoleFn: func(ctx context.Context, boardID, userID, role string) error {
			return errors.New("db down")
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	body := strings.NewReader(`{"role":"manager"}`)
	req := httptest.NewRequest(http.MethodPatch, "/boards/"+validBoardID+"/members/"+otherUserID, body)
	req = chiCtx(req, "boardID", validBoardID, "userID", otherUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.UpdateMemberRole)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ────────────────────────────────────────────────
// LeaveBoard
// ────────────────────────────────────────────────

func TestLeaveBoard_Member_Success(t *testing.T) {
	var removedUser string
	svc := &mock.MockBoardService{
		RemoveBoardMemberFn: func(ctx context.Context, boardID, userID string) error {
			removedUser = userID
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/leave", nil)
	req = chiCtx(req, "boardID", validBoardID)
	req = withUserID(req, validUserID)
	req = withBoardRole(req, "member")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.LeaveBoard)(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, validUserID, removedUser, "LeaveBoard must remove the caller, not someone else")
}

func TestLeaveBoard_Manager_Success(t *testing.T) {
	svc := &mock.MockBoardService{
		RemoveBoardMemberFn: func(ctx context.Context, boardID, userID string) error {
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/leave", nil)
	req = chiCtx(req, "boardID", validBoardID)
	req = withUserID(req, validUserID)
	req = withBoardRole(req, "manager")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.LeaveBoard)(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
}

// TestLeaveBoard_Owner_Returns403 — load-bearing safety guarantee. A board
// without an owner becomes unreachable: no one can invite, no one can promote.
// The handler rejects with a clear message instead of silently removing the
// owner. Removing this test would mask a regression that orphans boards.
func TestLeaveBoard_Owner_Returns403(t *testing.T) {
	svc := &mock.MockBoardService{
		RemoveBoardMemberFn: func(ctx context.Context, boardID, userID string) error {
			t.Fatal("owner must not be removed by LeaveBoard")
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/leave", nil)
	req = chiCtx(req, "boardID", validBoardID)
	req = withUserID(req, validUserID)
	req = withBoardRole(req, "owner")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.LeaveBoard)(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
	assert.Contains(t, strings.ToLower(w.Body.String()), "transfer ownership", "error must guide user toward the fix")
}

func TestLeaveBoard_MissingUserID_Returns401(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/leave", nil)
	req = chiCtx(req, "boardID", validBoardID)
	req = withBoardRole(req, "member") // role present but auth missing
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.LeaveBoard)(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

// TestLeaveBoard_MissingRoleContext_Returns403 — defense-in-depth: if the
// route is ever wired without RequireBoardMember upstream, the role lookup
// fails and we must refuse rather than treat absent==non-owner.
func TestLeaveBoard_MissingRoleContext_Returns403(t *testing.T) {
	svc := &mock.MockBoardService{
		RemoveBoardMemberFn: func(ctx context.Context, boardID, userID string) error {
			t.Fatal("must not call remove without role context")
			return nil
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/leave", nil)
	req = chiCtx(req, "boardID", validBoardID)
	req = withUserID(req, validUserID)
	// No withBoardRole — middleware chain misconfigured.
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.LeaveBoard)(w, req)

	assert.Equal(t, http.StatusForbidden, w.Code)
}

func TestLeaveBoard_InvalidBoardID_Returns400(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/boards/bad/leave", nil)
	req = chiCtx(req, "boardID", "bad")
	req = withUserID(req, validUserID)
	req = withBoardRole(req, "member")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.LeaveBoard)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestLeaveBoard_ServiceError_Returns500(t *testing.T) {
	svc := &mock.MockBoardService{
		RemoveBoardMemberFn: func(ctx context.Context, boardID, userID string) error {
			return errors.New("db down")
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodPost, "/boards/"+validBoardID+"/leave", nil)
	req = chiCtx(req, "boardID", validBoardID)
	req = withUserID(req, validUserID)
	req = withBoardRole(req, "member")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.LeaveBoard)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ────────────────────────────────────────────────
// GetAllUsers
// ────────────────────────────────────────────────

func TestGetAllUsers_DBError_Returns500(t *testing.T) {
	svc := &mock.MockBoardService{
		GetAllUsersFn: func(ctx context.Context) ([]db.GetAllUsersRow, error) {
			return nil, errors.New("query failed")
		},
	}
	h := NewBoardHandler(svc, nil, nil)

	req := httptest.NewRequest(http.MethodGet, "/users", nil)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetAllUsers)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}
