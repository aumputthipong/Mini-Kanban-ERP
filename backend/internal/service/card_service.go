package service

import (
	"context"
	"fmt"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/pgutil"
	"github.com/google/uuid"
)

type UpdateCardParams struct {
	ID             uuid.UUID
	Title          string
	Description    *string
	DueDate        *time.Time
	AssigneeID     *uuid.UUID
	Priority       *string
	EstimatedHours *float64
}

type CardData struct {
	ID           uuid.UUID
	ColumnID     uuid.UUID
	Title        string
	Description  *string
	Position     float64
	DueDate      *time.Time
	AssigneeID   *uuid.UUID
	AssigneeName *string
	Priority     *string
}


type CardService struct {
	queries *db.Queries
}


func (s *BoardService) GetCard(ctx context.Context, cardID uuid.UUID) (db.Card, error) {
	// Best Practice: ถ้ามี Logic สิทธิ์การเข้าถึง (Authorization) ควรทำในชั้นนี้
	// ก่อนจะยอมให้ดึงข้อมูลออกไป

	card, err := s.queries.GetCard(ctx, cardID)
	if err != nil {
		return db.Card{}, err
	}

	return card, nil
}


func (s *BoardService) UpdateCard(ctx context.Context, arg UpdateCardParams) (db.Card, error) {
	card, err := s.queries.UpdateCard(ctx, db.UpdateCardParams{
		ID:             arg.ID,
		Title:        	arg.Title,
		Description:    pgutil.PtrToText(arg.Description),
		DueDate:        pgutil.TimePtrToDate(arg.DueDate),
		AssigneeID:     pgutil.PtrToPgUUID(arg.AssigneeID), // หรือ PtrToNullUUID ขึ้นอยู่กับว่า sqlc ของคุณใช้อะไร
		Priority:       pgutil.PtrToText(arg.Priority),
		EstimatedHours: pgutil.PtrToNumeric(arg.EstimatedHours),
	})
	if err != nil {
		return db.Card{}, fmt.Errorf("update card: %w", err)
	}
	return card, nil
}

func (s *BoardService) GetAllUsers(ctx context.Context) ([]db.GetAllUsersRow, error) {
    return s.queries.GetAllUsers(ctx)
}


func (s *BoardService) GetCardsByColumnIDs(ctx context.Context, columnIDs []uuid.UUID) ([]db.GetCardsByColumnIDsRow, error) {
	return s.queries.GetCardsByColumnIDs(ctx, columnIDs)
}

func (s *BoardService) CreateCard(ctx context.Context, arg db.CreateCardParams) (db.CreateCardRow, error) {
	return s.queries.CreateCard(ctx, arg)
}