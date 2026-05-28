package handler

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service/mock"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestGetSettings_Success(t *testing.T) {
	svc := &mock.MockUserSettingsService{
		GetFn: func(ctx context.Context, userID string) (service.UserSettingsData, error) {
			assert.Equal(t, validUserID, userID)
			return service.UserSettingsData{
				UserID:         userID,
				DefaultLanding: "today",
				ShowAllCards:   false,
				Timezone:       "Asia/Bangkok",
			}, nil
		},
	}
	h := NewUserSettingsHandler(svc)
	req := withUserID(httptest.NewRequest(http.MethodGet, "/api/me/settings", nil), validUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetSettings)(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	var got dto.UserSettingsResponse
	require.NoError(t, json.NewDecoder(w.Body).Decode(&got))
	assert.Equal(t, "today", got.DefaultLanding)
	assert.Equal(t, "Asia/Bangkok", got.Timezone)
}

func TestGetSettings_Unauthorized(t *testing.T) {
	h := NewUserSettingsHandler(&mock.MockUserSettingsService{})
	req := httptest.NewRequest(http.MethodGet, "/api/me/settings", nil)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.GetSettings)(w, req)

	assert.Equal(t, http.StatusUnauthorized, w.Code)
}

func TestUpdateSettings_PatchesOnlyProvidedFields(t *testing.T) {
	var captured service.UpdateUserSettingsParams
	svc := &mock.MockUserSettingsService{
		UpdateFn: func(ctx context.Context, userID string, p service.UpdateUserSettingsParams) (service.UserSettingsData, error) {
			captured = p
			return service.UserSettingsData{
				UserID:         userID,
				DefaultLanding: "my_work",
				ShowAllCards:   false,
				Timezone:       "Asia/Bangkok",
			}, nil
		},
	}
	h := NewUserSettingsHandler(svc)
	body := strings.NewReader(`{"default_landing":"my_work"}`)
	req := withUserID(httptest.NewRequest(http.MethodPatch, "/api/me/settings", body), validUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.UpdateSettings)(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	require.NotNil(t, captured.DefaultLanding)
	assert.Equal(t, "my_work", *captured.DefaultLanding)
	assert.Nil(t, captured.ShowAllCards, "omitted fields must stay nil")
	assert.Nil(t, captured.Timezone)
}

func TestUpdateSettings_InvalidLanding_400(t *testing.T) {
	svc := &mock.MockUserSettingsService{
		UpdateFn: func(ctx context.Context, userID string, p service.UpdateUserSettingsParams) (service.UserSettingsData, error) {
			return service.UserSettingsData{}, service.ErrInvalidLanding
		},
	}
	h := NewUserSettingsHandler(svc)
	body := strings.NewReader(`{"default_landing":"nope"}`)
	req := withUserID(httptest.NewRequest(http.MethodPatch, "/api/me/settings", body), validUserID)
	w := httptest.NewRecorder()

	httputil.MakeHandler(h.UpdateSettings)(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}
