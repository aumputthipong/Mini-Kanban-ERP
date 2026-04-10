package dto

import "time"

type SubtaskResponse struct {
	ID        string    `json:"id"`
	CardID    string    `json:"card_id"`
	Title     string    `json:"title"`
	IsDone    bool      `json:"is_done"`
	Position  float64   `json:"position"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

type UpdateSubtaskRequest struct {
	Title    *string  `json:"title"`
	IsDone   *bool    `json:"is_done"`
	Position *float64 `json:"position"`
}
