// internal/db/models.go หรือ internal/mapper/board.go
package mapper

import (
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	// "github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
)

func ToTrashedBoardDTO(b db.GetTrashedBoardsRow) dto.TrashedBoardDTO {
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

// func ToBoardSummaryDTO(b db.GetAllBoardsRow) dto.BoardSummaryDTO {
//     return dto.BoardSummaryDTO{
//         ID:    b.ID.String(),
//         Title: b.Title,
//     }
// }

// func ToCardDTO(card service.CardData) dto.CardDTO {
//     return dto.CardDTO{
//         ID:           card.ID.String(),
//         ColumnID:     card.ColumnID.String(),
//         Title:        card.Title,
//         Description:  pgutil.TextToPtr(card.Description),
//         Position:     card.Position,
//         DueDate:      pgutil.DateToPtr(card.DueDate),
//         AssigneeID:   pgutil.UUIDToPtr(card.AssigneeID),
//         AssigneeName: pgutil.TextToPtr(card.AssigneeName),
//         Priority:     pgutil.TextToPtr(card.Priority),
//     }
// }

func ToSubtaskResponse(s db.CardSubtask) dto.SubtaskResponse {
    return dto.SubtaskResponse{
        ID:        s.ID,
        CardID:    s.CardID,
        Title:     s.Title,
        IsDone:    s.IsDone,
        Position:  s.Position,
        CreatedAt: s.CreatedAt.Time,
        UpdatedAt: s.UpdatedAt.Time,
    }
}

func ToSubtaskResponses(subtasks []db.CardSubtask) []dto.SubtaskResponse {
    result := make([]dto.SubtaskResponse, len(subtasks))
    for i, s := range subtasks {
        result[i] = ToSubtaskResponse(s)
    }
    return result
}