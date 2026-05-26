package dto

import "time"

type TagResponse struct {
	ID      string `json:"id"`
	BoardID string `json:"board_id"`
	Name    string `json:"name"`
	Color   string `json:"color"`
}

type CardResponse struct {
	ID                  string        `json:"id"`
	ColumnID            string        `json:"column_id"`
	Title               string        `json:"title"`
	Description         *string       `json:"description"`
	Position            float64       `json:"position"`
	DueDate             *string       `json:"due_date"`
	EstimatedHours      *float64      `json:"estimated_hours"`
	AssigneeID          *string       `json:"assignee_id"`
	AssigneeName        *string       `json:"assignee_name"`
	Priority            *string       `json:"priority"`
	IsDone              bool          `json:"is_done"`
	CompletedAt         *string       `json:"completed_at"`
	CreatedAt           *string       `json:"created_at"`
	CreatedBy           *string       `json:"created_by"`
	TotalSubtasks       int64         `json:"total_subtasks"`
	CompletedSubtasks   int64         `json:"completed_subtasks"`
	Tags                []TagResponse `json:"tags"`
	AcceptanceCriteria  *string       `json:"acceptance_criteria"`
	ImplementationNote  *string       `json:"implementation_note"`
}

type MyTaskResponse struct {
	ID             string   `json:"id"`
	Title          string   `json:"title"`
	BoardID        string   `json:"board_id"`
	BoardName      string   `json:"board_name"`
	ColumnName     string   `json:"column_name"`
	Priority       *string  `json:"priority"`
	DueDate        *string  `json:"due_date"`
	EstimatedHours *float64 `json:"estimated_hours"`
	Status         string   `json:"status"`
}

type CreateCardRequest struct {
	ColumnID   string  `json:"column_id"   validate:"required,uuid"`
	Title      string  `json:"title"       validate:"required,min=1,max=200"`
	DueDate    *string `json:"due_date"    validate:"omitempty,datetime=2006-01-02"`
	AssigneeID *string `json:"assignee_id" validate:"omitempty,uuid"`
	Priority   *string `json:"priority"    validate:"omitempty,oneof=low medium high"`
}

type UpdateCardRequest struct {
	Title              *string   `json:"title"               validate:"omitempty,min=1,max=200"`
	Description        *string   `json:"description"         validate:"omitempty,max=5000"`
	DueDate            *string   `json:"due_date"            validate:"omitempty,datetime=2006-01-02"`
	AssigneeID         *string   `json:"assignee_id"         validate:"omitempty,uuid"`
	Priority           *string   `json:"priority"            validate:"omitempty,oneof=low medium high"`
	EstimatedHours     *float64  `json:"estimated_hours"     validate:"omitempty,gte=0,lte=10000"`
	TagIDs             *[]string `json:"tag_ids"             validate:"omitempty,dive,uuid"`
	AcceptanceCriteria *string   `json:"acceptance_criteria" validate:"omitempty,max=10000"`
	ImplementationNote *string   `json:"implementation_note" validate:"omitempty,max=10000"`
}

type CreateTagRequest struct {
	Name  string `json:"name"  validate:"required,min=1,max=50"`
	Color string `json:"color" validate:"required,hexcolor"`
}

type SubtaskRequest struct {
	Title    string  `json:"title"    validate:"required,min=1,max=200"`
	Position float64 `json:"position" validate:"gte=0"`
}

type CardMovedBroadcastPayload struct {
	CardID      string     `json:"card_id"`
	NewColumnID string     `json:"new_column_id"`
	Position    float64    `json:"position"`
	IsDone      bool       `json:"is_done"`
	CompletedAt *time.Time `json:"completed_at"`
}
