package dto

import "time"

type CardResponse struct {
	ID                string   `json:"id"`
	ColumnID          string   `json:"column_id"`
	Title             string   `json:"title"`
	Description       *string  `json:"description"`
	Position          float64  `json:"position"`
	DueDate           *string  `json:"due_date"`
	EstimatedHours    *float64 `json:"estimated_hours"`
	AssigneeID        *string  `json:"assignee_id"`
	AssigneeName      *string  `json:"assignee_name"`
	Priority          *string  `json:"priority"`
	IsDone            bool     `json:"is_done"`
	CompletedAt       *string  `json:"completed_at"`
	CreatedBy         *string  `json:"created_by"`
	TotalSubtasks     int64    `json:"total_subtasks"`
	CompletedSubtasks int64    `json:"completed_subtasks"`
}

type CreateCardRequest struct {
	ColumnID   string  `json:"column_id"`
	Title      string  `json:"title"`
	DueDate    *string `json:"due_date"`
	AssigneeID *string `json:"assignee_id"`
	Priority   *string `json:"priority"`
}

type UpdateCardRequest struct {
	Title          *string  `json:"title"`
	Description    *string  `json:"description"`
	DueDate        *string  `json:"due_date"`
	AssigneeID     *string  `json:"assignee_id"`
	Priority       *string  `json:"priority"`
	EstimatedHours *float64 `json:"estimated_hours"`
}

type SubtaskRequest struct {
	Title    string  `json:"title"`
	Position float64 `json:"position"`
}

type CardMovedBroadcastPayload struct {
	CardID      string     `json:"card_id"`
	NewColumnID string     `json:"new_column_id"`
	Position    float64    `json:"position"`
	IsDone      bool       `json:"is_done"`
	CompletedAt *time.Time `json:"completed_at"`
}
