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



// MapToSubtaskResponse เป็นฟังก์ชันสำหรับแปลงจาก DB Model เป็น DTO
func MapToSubtaskResponse(subtask db.CardSubtask) SubtaskResponse {
	return SubtaskResponse{
		ID:        subtask.ID,
		CardID:    subtask.CardID,
		Title:     subtask.Title,
		IsDone:    subtask.IsDone,
		Position:  subtask.Position,
		CreatedAt: subtask.CreatedAt.Time,
		UpdatedAt: subtask.UpdatedAt.Time,
	}
}

// MapToSubtaskResponseList เป็นฟังก์ชันสำหรับแปลงแบบ Array (สำหรับ GET)
func MapToSubtaskResponseList(subtasks []db.CardSubtask) []SubtaskResponse {
	// Best Practice: กำหนด capacity ให้ slice ไว้ล่วงหน้า เพื่อให้ทำงานเร็วขึ้นและประหยัด Memory
	res := make([]SubtaskResponse, 0, len(subtasks))
	
	for _, st := range subtasks {
		res = append(res, MapToSubtaskResponse(st))
	}
	return res
}