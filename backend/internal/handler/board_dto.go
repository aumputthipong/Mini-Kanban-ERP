// internal/handler/board_dto.go
package handler

import "github.com/aumputthipong/mini-erp-kanban/backend/internal/service"

type ColumnResponse struct {
	ID       string         `json:"id"`
	Title    string         `json:"title"`
	Position float64        `json:"position"`
	Cards    []CardResponse `json:"cards"`
}

type BoardHandler struct {
	boardService *service.BoardService
}

type CreateBoardRequest struct {
	Title string `json:"title"`
}
type BoardSummaryResponse struct {
	ID    string `json:"id"`
	Title string `json:"title"`
}

type UserResponse struct {
	ID       string `json:"id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
}

type UpdateBoardRequest struct {
	Title  *string  `json:"title"`
	Budget *float64 `json:"budget"`
}

type BoardMemberResponse struct {
	ID       string `json:"id"`
	Role     string `json:"role"`
	UserID   string `json:"user_id"`
	Email    string `json:"email"`
	FullName string `json:"full_name"`
}

type AddMemberRequest struct {
	UserID string `json:"user_id"`
	Role   string `json:"role"`
}

type UpdateMemberRoleRequest struct {
	Role string `json:"role"`
}
