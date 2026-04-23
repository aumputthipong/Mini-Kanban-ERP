package middleware

import (
	"errors"
	"net/http"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/httputil"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"
)

type boardContextKey string

const BoardRoleKey boardContextKey = "boardRole"

// RequireBoardMember ตรวจว่า user ใน context เป็น member ของ board ใน URL param {boardID}
// ถ้าไม่ใช่ → 404 (ไม่ใช้ 403 เพื่อป้องกัน board ID enumeration)
// ถ้าใช่ → ใส่ role ลงใน context (อ่านต่อผ่าน BoardRoleKey)
func RequireBoardMember(svc service.BoardServicer) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			userID, ok := r.Context().Value(UserIDKey).(string)
			if !ok || userID == "" {
				httputil.RespondError(w, http.StatusUnauthorized, "Unauthorized")
				return
			}

			boardID := chi.URLParam(r, "boardID")
			if boardID == "" {
				httputil.RespondError(w, http.StatusBadRequest, "Missing board ID")
				return
			}

			role, err := svc.GetBoardMemberRole(r.Context(), boardID, userID)
			if err != nil {
				if errors.Is(err, pgx.ErrNoRows) {
					httputil.RespondError(w, http.StatusNotFound, "Not found")
					return
				}
				httputil.RespondError(w, http.StatusInternalServerError, "Failed to check board access")
				return
			}

			ctx := contextWithBoardRole(r.Context(), role)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}
