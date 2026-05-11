// Package middleware contains chi-compatible HTTP middleware: auth, board
// membership / role gating, CORS, rate limiting, and security headers.
//
// Order matters when composing them. The canonical chain for a board-scoped
// protected endpoint is:
//
//	RequireAuth → RequireBoardMember → RequireBoardRole(minRole) → handler
//
// The board-membership check needs the user from RequireAuth; the role check
// needs the role injected by RequireBoardMember.
package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/token"
)

// contextKey is unexported so callers cannot collide with our context values
// by passing in their own string literal.
type contextKey string

// UserIDKey is the context.Context key that holds the authenticated user's ID.
// Populated by RequireAuth; read via r.Context().Value(UserIDKey).(string).
const UserIDKey contextKey = "userID"

// RequireAuth verifies a JWT from either the auth_token cookie (preferred —
// HttpOnly so JS cannot read it) or an `Authorization: Bearer ...` header
// (used by tests / API clients). On success it stores the user ID in the
// request context under UserIDKey. On failure it short-circuits with 401
// without leaking which check failed.
func RequireAuth(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		var tokenStr string

		cookie, err := r.Cookie("auth_token")
		if err == nil {
			tokenStr = cookie.Value
		} else {
			auth := r.Header.Get("Authorization")
			if strings.HasPrefix(auth, "Bearer ") {
				tokenStr = strings.TrimPrefix(auth, "Bearer ")
			}
		}

		if tokenStr == "" {
			httputil.RespondError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		claims, err := token.Parse(tokenStr)
		if err != nil {
			httputil.RespondError(w, http.StatusUnauthorized, "Unauthorized")
			return
		}

		ctx := context.WithValue(r.Context(), UserIDKey, claims.UserID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
