package service

import (
	"context"
	"fmt"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/util"
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

	card, err := s.queries.GetCard(ctx, cardID.String())
	if err != nil {
		return db.Card{}, err
	}

	return card, nil
}

func (s *BoardService) UpdateCard(ctx context.Context, arg UpdateCardParams) (db.Card, error) {
	card, err := s.queries.UpdateCard(ctx, db.UpdateCardParams{
		ID:             arg.ID.String(), 
		Title:          arg.Title,
		
		// สำหรับ string pointer ส่งค่าเข้าไปตรงๆ ได้เลย
		Description:    arg.Description, 
		Priority:       arg.Priority,
		
		// สำหรับ type พิเศษ ใช้ Helper ที่รองรับ pgtype
		DueDate:        util.PtrToPgDate(arg.DueDate),      
		AssigneeID:     util.PtrUUIDToPgUUID(arg.AssigneeID), 
		EstimatedHours: util.PtrFloatToPgNumeric(arg.EstimatedHours),
	})

	if err != nil {
		return db.Card{}, fmt.Errorf("update card: %w", err)
	}

	return card, nil
}

func formatFloatPtr(f *float64) *string {
    if f == nil {
        return nil
    }
    s := fmt.Sprintf("%.2f", *f)
    return &s
}

func (s *BoardService) GetAllUsers(ctx context.Context) ([]db.GetAllUsersRow, error) {
    return s.queries.GetAllUsers(ctx)
}


func (s *BoardService) GetCardsByColumnIDs(ctx context.Context, columnIDs []uuid.UUID) ([]db.GetCardsByColumnIDsRow, error) {
    ids := make([]string, len(columnIDs))

    for i, id := range columnIDs {
        ids[i] = id.String()
    }

    // 3. ส่ง slice ของ string ให้กับ sqlc
    return s.queries.GetCardsByColumnIDs(ctx, ids)
}
func (s *BoardService) CreateCard(ctx context.Context, arg db.CreateCardParams) (db.CreateCardRow, error) {
	return s.queries.CreateCard(ctx, arg)
}