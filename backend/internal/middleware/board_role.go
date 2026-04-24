package middleware

import (
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/core"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
)

// roleRank ระบุลำดับสิทธิ์ — ค่ามากกว่า = สิทธิ์สูงกว่า
// ใช้เปรียบเทียบว่า role ของ user มีสิทธิ์เพียงพอสำหรับ minRole ที่ route กำหนด
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

// RequireBoardRole ต้องวางหลัง RequireBoardMember (อ่าน role จาก context ที่ middleware นั้น inject ไว้)
// ถ้า role ปัจจุบัน < minRole → 403
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
