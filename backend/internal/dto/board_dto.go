// internal/dto/board_dto.go
package dto

import "time"

type ColumnResponse struct {
    ID       string         `json:"id"`
    Title    string         `json:"title"`
    Position float64        `json:"position"`
    Category string         `json:"category"`
    Color    *string        `json:"color,omitempty"`
    Cards    []CardResponse `json:"cards"`
}

type CreateBoardRequest struct {
	Title string `json:"title"`
}
type MemberSummary struct {
	UserID   string `json:"user_id"`
	FullName string `json:"full_name"`
}

type BoardSummaryResponse struct {
	ID         string          `json:"id"`
	Title      string          `json:"title"`
	UpdatedAt  time.Time       `json:"updated_at"`
	TotalCards int             `json:"total_cards"`
	DoneCards  int             `json:"done_cards"`
	Members    []MemberSummary `json:"members"`
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



type TrashedBoardDTO struct {
    ID        string    `json:"id"`
    Title     string    `json:"title"`
    DeletedAt time.Time `json:"deleted_at"`
}