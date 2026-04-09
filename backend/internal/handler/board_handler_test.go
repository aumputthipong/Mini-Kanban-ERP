package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service/mock"
	"github.com/go-chi/chi/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// chiCtx ฉีด URL params เข้า request context สำหรับ chi router
func chiCtx(r *http.Request, pairs ...string) *http.Request {
	rctx := chi.NewRouteContext()
	for i := 0; i+1 < len(pairs); i += 2 {
		rctx.URLParams.Add(pairs[i], pairs[i+1])
	}
	return r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, rctx))
}

// withUserID ฉีด userID เข้า context เหมือน middleware ทำ
func withUserID(r *http.Request, userID string) *http.Request {
	return r.WithContext(context.WithValue(r.Context(), middleware.UserIDKey, userID))
}

const validBoardID = "452ae618-9e69-49f5-88a9-47728a5f17ac"
const validUserID = "550e8400-e29b-41d4-a716-446655440000"

// ────────────────────────────────────────────────
// GetAllBoards
// ────────────────────────────────────────────────

func TestGetAllBoards_Success(t *testing.T) {
	svc := &mock.MockBoardService{
		GetAllBoardsFn: func(ctx context.Context) ([]service.BoardSummaryData, error) {
			return []service.BoardSummaryData{
				{ID: "id-1", Title: "Board A"},
				{ID: "id-2", Title: "Board B"},
			}, nil
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodGet, "/boards", nil)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetAllBoards)(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var result []map[string]interface{}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&result))
	assert.Len(t, result, 2)
	assert.Equal(t, "Board A", result[0]["title"])
}

func TestGetAllBoards_DBError(t *testing.T) {
	svc := &mock.MockBoardService{
		GetAllBoardsFn: func(ctx context.Context) ([]service.BoardSummaryData, error) {
			return nil, errors.New("connection refused")
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodGet, "/boards", nil)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetAllBoards)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ────────────────────────────────────────────────
// GetBoardData
// ────────────────────────────────────────────────

func TestGetBoardData_Success(t *testing.T) {
	svc := &mock.MockBoardService{
		GetBoardWithCardsFn: func(ctx context.Context, boardID string) ([]service.ColumnData, error) {
			return []service.ColumnData{
				{ID: "col-1", Title: "To Do", Category: "TODO", Cards: []service.CardData{}},
			}, nil
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodGet, "/boards/"+validBoardID, nil)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetBoardData)(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var result []map[string]interface{}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&result))
	assert.Len(t, result, 1)
	assert.Equal(t, "To Do", result[0]["title"])
}

func TestGetBoardData_InvalidBoardID(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodGet, "/boards/not-a-uuid", nil)
	req = chiCtx(req, "boardID", "not-a-uuid")
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetBoardData)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestGetBoardData_ServiceError(t *testing.T) {
	svc := &mock.MockBoardService{
		GetBoardWithCardsFn: func(ctx context.Context, boardID string) ([]service.ColumnData, error) {
			return nil, errors.New("db timeout")
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodGet, "/boards/"+validBoardID, nil)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetBoardData)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ────────────────────────────────────────────────
// CreateBoard
// ────────────────────────────────────────────────

func TestCreateBoard_Success(t *testing.T) {
	svc := &mock.MockBoardService{
		CreateBoardFn: func(ctx context.Context, title string, ownerID string) (string, error) {
			assert.Equal(t, "My Board", title)
			assert.Equal(t, validUserID, ownerID)
			return validBoardID, nil
		},
	}
	h := NewBoardHandler(svc)
	body := strings.NewReader(`{"title":"My Board"}`)
	req := httptest.NewRequest(http.MethodPost, "/boards", body)
	req = withUserID(req, validUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.CreateBoard)(w, req)

	assert.Equal(t, http.StatusCreated, w.Code)

	var result map[string]string
	require.NoError(t, json.NewDecoder(w.Body).Decode(&result))
	assert.Equal(t, validBoardID, result["id"])
}

func TestCreateBoard_Unauthorized(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc)
	body := strings.NewReader(`{"title":"My Board"}`)
	req := httptest.NewRequest(http.MethodPost, "/boards", body)
	// ไม่ใส่ userID ใน context → unauthorized
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.CreateBoard)(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestCreateBoard_InvalidJSON(t *testing.T) {
	svc := &mock.MockBoardService{}
	h := NewBoardHandler(svc)
	body := strings.NewReader(`{invalid json}`)
	req := httptest.NewRequest(http.MethodPost, "/boards", body)
	req = withUserID(req, validUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.CreateBoard)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

// ────────────────────────────────────────────────
// MoveToTrash
// ────────────────────────────────────────────────

func TestMoveToTrash_Success(t *testing.T) {
	called := false
	svc := &mock.MockBoardService{
		MoveBoardToTrashFn: func(ctx context.Context, boardID string) error {
			assert.Equal(t, validBoardID, boardID)
			called = true
			return nil
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodDelete, "/boards/"+validBoardID, nil)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.MoveToTrash)(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.True(t, called)
}

func TestMoveToTrash_ServiceError(t *testing.T) {
	svc := &mock.MockBoardService{
		MoveBoardToTrashFn: func(ctx context.Context, boardID string) error {
			return errors.New("board not found")
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodDelete, "/boards/"+validBoardID, nil)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.MoveToTrash)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ────────────────────────────────────────────────
// HardDelete
// ────────────────────────────────────────────────

func TestHardDelete_Success(t *testing.T) {
	svc := &mock.MockBoardService{
		HardDeleteBoardFn: func(ctx context.Context, id string) error {
			return nil
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodDelete, "/boards/"+validBoardID+"/hard", nil)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.HardDelete)(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
}

// ────────────────────────────────────────────────
// GetBoardMembers
// ────────────────────────────────────────────────

func TestGetBoardMembers_Success(t *testing.T) {
	svc := &mock.MockBoardService{
		GetBoardMembersFn: func(ctx context.Context, boardID string) ([]db.GetBoardMembersRow, error) {
			return []db.GetBoardMembersRow{
				{ID: "m-1", Role: "owner", UserID: validUserID, Email: "a@example.com", FullName: "Alice"},
			}, nil
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodGet, "/boards/"+validBoardID+"/members", nil)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetBoardMembers)(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var result []map[string]interface{}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&result))
	assert.Len(t, result, 1)
	assert.Equal(t, "Alice", result[0]["full_name"])
}

func TestGetBoardMembers_DBError(t *testing.T) {
	svc := &mock.MockBoardService{
		GetBoardMembersFn: func(ctx context.Context, boardID string) ([]db.GetBoardMembersRow, error) {
			return nil, errors.New("query failed")
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodGet, "/boards/"+validBoardID+"/members", nil)
	req = chiCtx(req, "boardID", validBoardID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetBoardMembers)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

// ────────────────────────────────────────────────
// GetAllUsers
// ────────────────────────────────────────────────

func TestGetAllUsers_Success(t *testing.T) {
	svc := &mock.MockBoardService{
		GetAllUsersFn: func(ctx context.Context) ([]db.GetAllUsersRow, error) {
			return []db.GetAllUsersRow{
				{ID: "u-1", Email: "bob@example.com", FullName: "Bob"},
			}, nil
		},
	}
	h := NewBoardHandler(svc)
	req := httptest.NewRequest(http.MethodGet, "/users", nil)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetAllUsers)(w, req)

	assert.Equal(t, http.StatusOK, w.Code)

	var result []map[string]interface{}
	require.NoError(t, json.NewDecoder(w.Body).Decode(&result))
	assert.Len(t, result, 1)
	assert.Equal(t, "Bob", result[0]["full_name"])
}
