package middleware

import "context"

func contextWithBoardRole(ctx context.Context, role string) context.Context {
	return context.WithValue(ctx, BoardRoleKey, role)
}

// BoardRoleFromContext returns the caller's role on the current board.
// Only populated when the request passed through RequireBoardMember.
func BoardRoleFromContext(ctx context.Context) (string, bool) {
	role, ok := ctx.Value(BoardRoleKey).(string)
	return role, ok && role != ""
}
