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
	TagIDs         *[]string // nil = don't touch, &[]string{} = clear all
}

type CardService struct {
	queries *db.Queries
}

func (s *BoardService) GetCard(ctx context.Context, cardID string) (db.Card, error) {
	return s.queries.GetCard(ctx, cardID)
}

func (s *BoardService) UpdateCard(ctx context.Context, arg UpdateCardParams) (db.Card, error) {
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return db.Card{}, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	card, err := qtx.UpdateCard(ctx, db.UpdateCardParams{
		ID:             arg.ID,
		Title:          arg.Title,
		Description:    arg.Description,
		Priority:       arg.Priority,
		DueDate:        arg.DueDate,
		AssigneeID:     arg.AssigneeID,
		EstimatedHours: util.PtrFloatToPgNumeric(arg.EstimatedHours),
	})
	if err != nil {
		return db.Card{}, fmt.Errorf("update card: %w", err)
	}

	if arg.TagIDs != nil {
		if len(*arg.TagIDs) > 5 {
			return db.Card{}, fmt.Errorf("card cannot have more than 5 tags")
		}
		if err := qtx.ClearCardTags(ctx, arg.ID); err != nil {
			return db.Card{}, fmt.Errorf("clear card tags: %w", err)
		}
		for _, tagID := range *arg.TagIDs {
			if err := qtx.InsertCardTag(ctx, db.InsertCardTagParams{CardID: arg.ID, TagID: tagID}); err != nil {
				return db.Card{}, fmt.Errorf("insert card tag: %w", err)
			}
		}
	}

	if err := tx.Commit(ctx); err != nil {
		return db.Card{}, fmt.Errorf("commit tx: %w", err)
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
