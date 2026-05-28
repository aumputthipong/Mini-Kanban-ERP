package handler

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service/mock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetMyTasks_ReturnsCardsAndCounts(t *testing.T) {
	svc := &mock.MockBoardService{
		GetMyWorkFn: func(ctx context.Context, opts service.MyWorkOptions) (service.MyWorkResult, error) {
			assert.Equal(t, validUserID, opts.UserID)
			assert.Equal(t, service.MyWorkFilter("all"), opts.Filter)
			assert.False(t, opts.IncludeUnassigned)
			return service.MyWorkResult{
				Cards: []service.MyTaskData{
					{ID: "c1", Title: "T1", BoardID: "b1", Status: "todo", Group: "overdue"},
					{ID: "c2", Title: "T2", BoardID: "b1", Status: "todo", Group: "today"},
				},
				Counts: service.MyWorkCounts{Overdue: 1, Today: 1, Total: 2},
			}, nil
		},
	}
	h := NewBoardHandler(svc, nil)
	req := withUserID(httptest.NewRequest(http.MethodGet, "/my-tasks?filter=all", nil), validUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetMyTasks)(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var got dto.MyWorkResponse
	require.NoError(t, json.NewDecoder(w.Body).Decode(&got))
	assert.Len(t, got.Cards, 2)
	assert.Equal(t, "overdue", got.Cards[0].Group)
	assert.Equal(t, 2, got.Counts.Total)
	assert.Equal(t, 1, got.Counts.Overdue)
	assert.Equal(t, 1, got.Counts.Today)
}

func TestGetMyTasks_FilterFromQuery_IncludeFromSettings(t *testing.T) {
	var captured service.MyWorkOptions
	svc := &mock.MockBoardService{
		GetMyWorkFn: func(ctx context.Context, opts service.MyWorkOptions) (service.MyWorkResult, error) {
			captured = opts
			return service.MyWorkResult{}, nil
		},
	}
	settings := &mock.MockUserSettingsService{
		GetFn: func(ctx context.Context, userID string) (service.UserSettingsData, error) {
			return service.UserSettingsData{
				UserID:         userID,
				DefaultLanding: "today",
				ShowAllCards:   true,
				Timezone:       "Asia/Bangkok",
			}, nil
		},
	}
	h := NewBoardHandler(svc, settings)
	req := withUserID(
		httptest.NewRequest(http.MethodGet, "/my-tasks?filter=today&include_unassigned=false", nil),
		validUserID,
	)
	httputil.MakeHandler(h.GetMyTasks)(httptest.NewRecorder(), req)

	assert.Equal(t, service.MyWorkFilter("today"), captured.Filter)
	// include_unassigned in the URL is intentionally ignored; settings wins.
	assert.True(t, captured.IncludeUnassigned)
	assert.False(t, captured.Today.IsZero(), "service should receive a non-zero Today pivot")
}

func TestGetMyTasks_Unauthorized(t *testing.T) {
	h := NewBoardHandler(&mock.MockBoardService{}, nil)
	req := httptest.NewRequest(http.MethodGet, "/my-tasks", nil) // no user ctx
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetMyTasks)(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestGetMyTasks_ServiceError(t *testing.T) {
	svc := &mock.MockBoardService{
		GetMyWorkFn: func(ctx context.Context, opts service.MyWorkOptions) (service.MyWorkResult, error) {
			return service.MyWorkResult{}, errors.New("db down")
		},
	}
	h := NewBoardHandler(svc, nil)
	req := withUserID(httptest.NewRequest(http.MethodGet, "/my-tasks", nil), validUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetMyTasks)(w, req)

	assert.Equal(t, http.StatusInternalServerError, w.Code)
}

func TestCompleteMyTask_Success(t *testing.T) {
	svc := &mock.MockBoardService{
		CompleteMyTaskFn: func(ctx context.Context, cardID, userID string) (bool, error) {
			assert.Equal(t, validCardID, cardID)
			assert.Equal(t, validUserID, userID)
			return true, nil
		},
	}
	h := NewBoardHandler(svc, nil)
	req := chiCtx(
		withUserID(httptest.NewRequest(http.MethodPost, "/my-tasks/"+validCardID+"/complete", nil), validUserID),
		"cardID", validCardID,
	)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.CompleteMyTask)(w, req)
	assert.Equal(t, http.StatusNoContent, w.Code)
}

func TestCompleteMyTask_NotAssignee_404(t *testing.T) {
	svc := &mock.MockBoardService{
		CompleteMyTaskFn: func(ctx context.Context, cardID, userID string) (bool, error) {
			return false, nil
		},
	}
	h := NewBoardHandler(svc, nil)
	req := chiCtx(
		withUserID(httptest.NewRequest(http.MethodPost, "/my-tasks/"+validCardID+"/complete", nil), validUserID),
		"cardID", validCardID,
	)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.CompleteMyTask)(w, req)
	assert.Equal(t, http.StatusNotFound, w.Code)
}
