package dto

import (
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
)

type SubtaskResponse struct {
	ID        string    `json:"id"`
	CardID    string    `json:"card_id"`
	Title     string    `json:"title"`
	IsDone    bool      `json:"is_done"`
	Position  float64   `json:"position"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

// MapToSubtaskResponse แปลง db.CardSubtask → SubtaskResponse
func MapToSubtaskResponse(subtask db.CardSubtask) SubtaskResponse {
	var createdAt, updatedAt time.Time
	if subtask.CreatedAt != nil {
		createdAt = *subtask.CreatedAt
	}
	if subtask.UpdatedAt != nil {
		updatedAt = *subtask.UpdatedAt
	}
	return SubtaskResponse{
		ID:        subtask.ID,
		CardID:    subtask.CardID,
		Title:     subtask.Title,
		IsDone:    subtask.IsDone,
		Position:  subtask.Position,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}

// MapToSubtaskResponseList แปลง []db.CardSubtask → []SubtaskResponse
func MapToSubtaskResponseList(subtasks []db.CardSubtask) []SubtaskResponse {
	res := make([]SubtaskResponse, 0, len(subtasks))
	for _, st := range subtasks {
		res = append(res, MapToSubtaskResponse(st))
	}
	return res
}

type UpdateSubtaskRequest struct {
	Title    *string  `json:"title"`
	IsDone   *bool    `json:"is_done"`
	Position *float64 `json:"position"`
}
