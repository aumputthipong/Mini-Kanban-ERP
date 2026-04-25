// internal/handler/auth_handler.go
package handler

import (
	"errors"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/middleware"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/token"
)

type AuthHandler struct {
	authService service.AuthServicer
	production  bool
}

func NewAuthHandler(authService service.AuthServicer, production bool) *AuthHandler {
	return &AuthHandler{authService: authService, production: production}
}

// authUserResponse is the shared response body for register / login / oauth.
type authUserResponse struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
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

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) error {
	var req registerRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
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

	tok, err := token.Generate(user.ID, user.Email)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to generate token", err)
	}

	token.SetAuthCookie(w, tok, h.production)
	httputil.RespondJSON(w, http.StatusCreated, authUserResponse{
		ID:       user.ID,
		Email:    user.Email,
		FullName: user.FullName,
	})
	return nil
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) error {
	var req loginRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	user, err := h.authService.Login(r.Context(), req.Email, req.Password)
	if err != nil {
		if errors.Is(err, service.ErrInvalidCreds) || errors.Is(err, service.ErrOAuthOnly) {
			return httputil.NewAPIError(http.StatusUnauthorized, "Invalid credentials", nil)
		}
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to login", err)
	}

	tok, err := token.Generate(user.ID, user.Email)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to generate token", err)
	}

	token.SetAuthCookie(w, tok, h.production)
	httputil.RespondJSON(w, http.StatusOK, authUserResponse{
		ID:       user.ID,
		Email:    user.Email,
		FullName: user.FullName,
	})
	return nil
}

func (h *AuthHandler) OAuthCallback(w http.ResponseWriter, r *http.Request) error {
	var req oauthRequest
	if err := httputil.DecodeJSON(r, &req); err != nil {
		return httputil.NewAPIError(http.StatusBadRequest, "Invalid request body", err)
	}

	user, err := h.authService.UpsertOAuthUser(r.Context(), req.Email, req.FullName, req.Provider, req.ProviderID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to authenticate", err)
	}

	tok, err := token.Generate(user.ID, user.Email)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to generate token", err)
	}

	token.SetAuthCookie(w, tok, h.production)
	httputil.RespondJSON(w, http.StatusOK, authUserResponse{
		ID:       user.ID,
		Email:    user.Email,
		FullName: user.FullName,
	})
	return nil
}

func (h *AuthHandler) Logout(w http.ResponseWriter, r *http.Request) error {
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    "",
		Path:     "/",
		HttpOnly: true,
		MaxAge:   -1,
	})
	w.WriteHeader(http.StatusNoContent)
	return nil
}

func (h *AuthHandler) Me(w http.ResponseWriter, r *http.Request) error {
	userID, ok := r.Context().Value(middleware.UserIDKey).(string)
	if !ok || userID == "" {
		return httputil.NewAPIError(http.StatusUnauthorized, "Unauthorized", nil)
	}
	user, err := h.authService.GetUserByID(r.Context(), userID)
	if err != nil {
		return httputil.NewAPIError(http.StatusInternalServerError, "Failed to load user", err)
	}
	httputil.RespondJSON(w, http.StatusOK, map[string]string{
		"user_id":   user.ID,
		"email":     user.Email,
		"full_name": user.FullName,
	})
	return nil
}
