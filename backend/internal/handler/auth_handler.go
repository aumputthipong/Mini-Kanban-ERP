// internal/handler/auth_handler.go
package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/token"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{authService: authService}
}

type registerRequest struct {
	Email    string `json:"email"`
	FullName string `json:"full_name"`
	Password string `json:"password"`
}

type loginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type oauthRequest struct {
	Email      string `json:"email"`
	FullName   string `json:"full_name"`
	Provider   string `json:"provider"`
	ProviderID string `json:"provider_id"`
}

func setAuthCookie(w http.ResponseWriter, token string) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		HttpOnly: true,
		Secure:   false, // เปลี่ยนเป็น true ใน production
		SameSite: http.SameSiteLaxMode,
		Expires:  time.Now().Add(7 * 24 * time.Hour),
	})
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) error {

	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// จุดที่ 1: อันนี้คุณใส่ httputil. ถูกต้องแล้ว
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	if req.Email == "" || req.FullName == "" || req.Password == "" {
		return httputil.NewAPIError(http.StatusBadRequest, "Email, full name and password are required", nil)
	}

	if len(req.Password) < 8 {
		return httputil.NewAPIError(http.StatusBadRequest, "Password must be at least 8 characters", nil)
	}

	user, err := h.authService.Register(r.Context(), service.RegisterParams{
		Email:    req.Email,
		FullName: req.FullName,
		Password: req.Password,
	})
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			return httputil.NewAPIError(http.StatusConflict, "Email already in use", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to register", err)
	}

	token, err := token.Generate(user.ID.String(), user.Email)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to generate token", err)
	}

	setAuthCookie(w, token)
	httputil.RespondJSON(w, http.StatusCreated, map[string]string{
		"id":        user.ID.String(),
		"email":     user.Email,
		"full_name": user.FullName,
	})
	return nil
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) error {

	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	user, err := h.authService.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCreds) || errors.Is(err, service.ErrOAuthOnly) {
			return httputil.NewAPIError(http.StatusUnauthorized, err.Error(), nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to login", err)
	}

	token, err := token.Generate(user.ID.String(), user.Email)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to generate token", err)
	}

	setAuthCookie(w, token)
	httputil.RespondJSON(w, http.StatusOK, map[string]string{
		"id":        user.ID.String(),
		"email":     user.Email,
		"full_name": user.FullName,
	})
	return nil
}

func (h *AuthHandler) OAuthCallback(w http.ResponseWriter, r *http.Request) error {

	var req oauthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	user, err := h.authService.UpsertOAuthUser(r.Context(), req.Email, req.FullName, req.Provider, req.ProviderID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to authenticate", err)
	}

	token, err := token.Generate(user.ID.String(), user.Email)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to generate token", err)
	}

	setAuthCookie(w, token)
	httputil.RespondJSON(w, http.StatusOK, map[string]string{
		"id":        user.ID.String(),
		"email":     user.Email,
		"full_name": user.FullName,
	})
	return nil
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
	w.WriteHeader(http.StatusNoContent)
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) {
	userID, _ := r.Context().Value(middleware.UserIDKey).(string)
	httputil.RespondJSON(w, http.StatusOK, map[string]string{"user_id": userID})
}
