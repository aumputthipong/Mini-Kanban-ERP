package service

import (
	"context"
	"fmt"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/util"
)

// UpdateCardParams คือข้อมูลสำหรับอัพเดต card ที่รับมาจาก handler
// ใช้ string สำหรับ ID, *string สำหรับ nullable fields
type UpdateCardParams struct {
	ID             string
	Title          string
	Description    *string
	DueDate        *time.Time
	AssigneeID     *string
	Priority       *string
	EstimatedHours *float64
}

type CardService struct {
	queries *db.Queries
}

func (s *BoardService) GetCard(ctx context.Context, cardID string) (db.Card, error) {
	return s.queries.GetCard(ctx, cardID)
}

func (s *BoardService) UpdateCard(ctx context.Context, arg UpdateCardParams) (db.Card, error) {
	card, err := s.queries.UpdateCard(ctx, db.UpdateCardParams{
		ID:          arg.ID,
		Title:       arg.Title,
		Description: arg.Description,
		Priority:    arg.Priority,
		// *time.Time และ *string ส่งตรงได้เลย sqlc รองรับ nil = NULL
		DueDate:        arg.DueDate,
		AssigneeID:     arg.AssigneeID,
		EstimatedHours: util.PtrFloatToPgNumeric(arg.EstimatedHours),
	})
	if err != nil {
		return db.Card{}, fmt.Errorf("update card: %w", err)
	}
	return card, nil
}

func (s *BoardService) GetAllUsers(ctx context.Context) ([]db.GetAllUsersRow, error) {
	return s.queries.GetAllUsers(ctx)
}

func (s *BoardService) GetCardsByColumnIDs(ctx context.Context, columnIDs []string) ([]db.GetCardsByColumnIDsRow, error) {
	return s.queries.GetCardsByColumnIDs(ctx, columnIDs)
}

func (s *BoardService) CreateCard(ctx context.Context, arg db.CreateCardParams) (db.CreateCardRow, error) {
	return s.queries.CreateCard(ctx, arg)
}
