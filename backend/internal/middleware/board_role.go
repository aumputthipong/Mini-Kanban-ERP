package middleware

import (
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/core"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
)

// roleRank assigns a numeric rank to each role so we can compare with `<`.
// Higher rank = more privilege. owner > manager > member.
func roleRank(r core.BoardRole) int {
	switch r {
	case core.RoleOwner:
		return 3
	case core.RoleManager:
		return 2
	case core.RoleMember:
		return 1
	}
	return 0
}

// RequireBoardRole gates the next handler on the caller having at least
// minRole on the current board. It MUST be chained after RequireBoardMember,
// which is what injects the role into the context. Returns 403 on insufficient
// privilege; the original 404-for-non-members policy lives in RequireBoardMember.
func RequireBoardRole(minRole core.BoardRole) func(http.Handler) http.Handler {
	minRank := roleRank(minRole)
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			role, ok := BoardRoleFromContext(r.Context())
			if !ok {
				httputil.RespondError(w, http.StatusForbidden, "Forbidden")
				return
			}
			if roleRank(core.BoardRole(role)) < minRank {
				httputil.RespondError(w, http.StatusForbidden, "You do not have permission to perform this action")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}
