// internal/handler/auth_handler.go
package handler

import (
	"encoding/json"
	"errors"
	"net/http"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
		"github.com/aumputthipong/mini-erp-kanban/backend/internal/token" // เปลี่ยน

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

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {


	var req registerRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	if req.Email == "" || req.FullName == "" || req.Password == "" {
		http.Error(w, "Email, full name and password are required", http.StatusBadRequest)
		return
	}

	if len(req.Password) < 8 {
		http.Error(w, "Password must be at least 8 characters", http.StatusBadRequest)
		return
	}

	user, err := h.authService.Register(r.Context(), service.RegisterParams{
		Email:    req.Email,
		FullName: req.FullName,
		Password: req.Password,
	})
	if err != nil {
		if errors.Is(err, service.ErrEmailTaken) {
			http.Error(w, "Email already in use", http.StatusConflict)
			return
		}
		http.Error(w, "Failed to register", http.StatusInternalServerError)
		return
	}

	token, err := token.Generate(user.ID.String(), user.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	setAuthCookie(w, token)
	respondJSON(w, http.StatusCreated, map[string]string{
		"id":        user.ID.String(),
		"email":     user.Email,
		"full_name": user.FullName,
	})
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {


	var req loginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.authService.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCreds) || errors.Is(err, service.ErrOAuthOnly) {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}
		http.Error(w, "Failed to login", http.StatusInternalServerError)
		return
	}

	token, err := token.Generate(user.ID.String(), user.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	setAuthCookie(w, token)
	respondJSON(w, http.StatusOK, map[string]string{
		"id":        user.ID.String(),
		"email":     user.Email,
		"full_name": user.FullName,
	})
}

func (h *AuthHandler) OAuthCallback(w http.ResponseWriter, r *http.Request) {


	var req oauthRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	user, err := h.authService.UpsertOAuthUser(r.Context(), req.Email, req.FullName, req.Provider, req.ProviderID)
	if err != nil {
		http.Error(w, "Failed to authenticate", http.StatusInternalServerError)
		return
	}

	token, err := token.Generate(user.ID.String(), user.Email)
	if err != nil {
		http.Error(w, "Failed to generate token", http.StatusInternalServerError)
		return
	}

	setAuthCookie(w, token)
	respondJSON(w, http.StatusOK, map[string]string{
		"id":        user.ID.String(),
		"email":     user.Email,
		"full_name": user.FullName,
	})
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
	respondJSON(w, http.StatusOK, map[string]string{"user_id": userID})
}