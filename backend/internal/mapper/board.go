// internal/mapper/board.go
package mapper

import (
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
)

func ToTrashedBoardDTO(b db.GetTrashedBoardsRow) dto.TrashedBoardDTO {
	// DeletedAt ยังเป็น pgtype.Timestamptz เพราะ schema ใช้ TIMESTAMP WITH TIME ZONE
	// ต้องเช็ค .Valid ก่อนดึงค่า
	var deletedAt time.Time
	if b.DeletedAt.Valid {
		deletedAt = b.DeletedAt.Time
	}
	return dto.TrashedBoardDTO{
		ID:        b.ID,
		Title:     b.Title,
		DeletedAt: deletedAt,
	}
}

func ToTrashedBoardDTOs(boards []db.GetTrashedBoardsRow) []dto.TrashedBoardDTO {
	result := make([]dto.TrashedBoardDTO, len(boards))
	for i, b := range boards {
		result[i] = ToTrashedBoardDTO(b)
	}
	return result
}

func ToSubtaskResponse(s db.CardSubtask) dto.SubtaskResponse {
	// CreatedAt และ UpdatedAt เป็น *time.Time (nullable TIMESTAMPTZ)
	// ใช้ deref ด้วย zero value ถ้า nil
	var createdAt, updatedAt time.Time
	if s.CreatedAt != nil {
		createdAt = *s.CreatedAt
	}
	if s.UpdatedAt != nil {
		updatedAt = *s.UpdatedAt
	}
	return dto.SubtaskResponse{
		ID:        s.ID,
		CardID:    s.CardID,
		Title:     s.Title,
		IsDone:    s.IsDone,
		Position:  s.Position,
		CreatedAt: createdAt,
		UpdatedAt: updatedAt,
	}
}

func ToSubtaskResponses(subtasks []db.CardSubtask) []dto.SubtaskResponse {
	result := make([]dto.SubtaskResponse, len(subtasks))
	for i, s := range subtasks {
		result[i] = ToSubtaskResponse(s)
	}
	return result
}
