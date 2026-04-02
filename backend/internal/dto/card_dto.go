package dto

import "time"

type CardResponse struct {
	ID             string   `json:"id"`
	ColumnID       string   `json:"column_id"`
	Title          string   `json:"title"`
	Description    *string  `json:"description"`
	Position       float64  `json:"position"`
	DueDate        *string  `json:"due_date"`
	EstimatedHours *float64 `json:"estimated_hours"`
	AssigneeID     *string  `json:"assignee_id"`
	AssigneeName   *string  `json:"assignee_name"`
	Priority       *string  `json:"priority"`
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

type SubtaskResponse struct {
	ID        string    `json:"id"`
	CardID    string    `json:"card_id"`
	Title     string    `json:"title"`
	IsDone    bool      `json:"is_done"`
	Position  float64   `json:"position"`
	CreatedAt time.Time `json:"created_at"`
}