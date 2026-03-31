// internal/service/board_service.go
package service

import (
	"context"
	"fmt"
	"log"
	"strings"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

type BoardService struct {
	queries *db.Queries
}

type UpdateCardParams struct {
	ID             pgtype.UUID
	Title          pgtype.Text
	Description    pgtype.Text
	DueDate        pgtype.Date
	AssigneeID     pgtype.UUID
	Priority       pgtype.Text
	EstimatedHours pgtype.Numeric
}

type CardData struct {
	ID           pgtype.UUID
	ColumnID     pgtype.UUID
	Title        string
	Description  pgtype.Text
	Position     float64
	DueDate      pgtype.Date
	AssigneeID   pgtype.UUID
	AssigneeName pgtype.Text
	Priority     pgtype.Text
}

type ColumnData struct {
	ID       pgtype.UUID
	Title    string
	Position float64
	Cards    []CardData
}

func NewBoardService(queries *db.Queries) *BoardService {
	return &BoardService{queries: queries}
}

func (s *BoardService) CreateBoard(ctx context.Context, title string) (pgtype.UUID, error) {
	if strings.TrimSpace(title) == "" {
		return pgtype.UUID{}, fmt.Errorf("board title cannot be empty")
	}

	board, err := s.queries.CreateBoard(ctx, title)
	if err != nil {
		return pgtype.UUID{}, fmt.Errorf("create board: %w", err)
	}

	defaultColumns := []struct {
		Title    string
		Position float64
	}{
		{"To Do", 1.0},
		{"In Progress", 2.0},
		{"Done", 3.0},
	}

	for _, col := range defaultColumns {
		_, err := s.queries.CreateColumn(ctx, db.CreateColumnParams{
			BoardID:  board.ID,
			Title:    col.Title,
			Position: col.Position,
		})
		if err != nil {
			log.Printf("Warning: failed to create default column %q for board %s: %v", col.Title, board.ID.String(), err)
		}
	}

	return board.ID, nil
}

func (s *BoardService) GetAllBoards(ctx context.Context) ([]db.GetAllActiveBoardsRow, error) {
	// return s.queries.GetAllBoards(ctx)
	return s.queries.GetAllActiveBoards(ctx)
}

func (s *BoardService) GetColumnsByBoardID(ctx context.Context, boardID pgtype.UUID) ([]db.Column, error) {
	return s.queries.GetColumnsByBoardID(ctx, boardID)
}

func (s *BoardService) GetCardsByColumnIDs(ctx context.Context, columnIDs []pgtype.UUID) ([]db.GetCardsByColumnIDsRow, error) {
	return s.queries.GetCardsByColumnIDs(ctx, columnIDs)
}

func (s *BoardService) CreateCard(ctx context.Context, arg db.CreateCardParams) (db.CreateCardRow, error) {
	return s.queries.CreateCard(ctx, arg)
}

func (s *BoardService) MoveBoardToTrash(ctx context.Context, boardID pgtype.UUID) error {
	// หากมีลอจิกการตรวจสอบสิทธิ์ (เช่น บอร์ดนี้เป็นของ user คนนี้จริงไหม) ให้ใส่ตรงนี้

	err := s.queries.MoveBoardToTrash(ctx, boardID)
	if err != nil {
		return err
	}
	return nil
}

func (s *BoardService) GetTrashedBoards(ctx context.Context) ([]db.GetTrashedBoardsRow, error) {
	return s.queries.GetTrashedBoards(ctx)
}

func (s *BoardService) HardDeleteBoard(ctx context.Context, id pgtype.UUID) error {
	return s.queries.HardDeleteBoard(ctx, id)
}

// เปลี่ยน Parameter ให้รับเป็น Pointer
func (s *BoardService) UpdateBoard(ctx context.Context, id pgtype.UUID, title *string, budget *float64) (db.Board, error) {

	// 1. ดึงข้อมูลบอร์ดปัจจุบันจาก Database ก่อน
	existingBoard, err := s.queries.GetBoardByID(ctx, id)
	if err != nil {
		return db.Board{}, err // คืนค่า Error ถ้าหาบอร์ดไม่เจอ
	}

	// 2. นำข้อมูลเดิมมาตั้งต้น
	newTitle := existingBoard.Title
	newBudget := existingBoard.Budget

	// 3. ตรวจสอบว่ามีการส่งค่า Title ใหม่มาหรือไม่ (เช็กว่าไม่เป็น nil)
	if title != nil {
		newTitle = *title // ใช้ค่าใหม่ที่ส่งมา
	}

	// 4. ตรวจสอบว่ามีการส่งค่า Budget ใหม่มาหรือไม่
	if budget != nil {
		newBudget.Scan(fmt.Sprintf("%f", *budget))
	}

	// 5. บันทึกข้อมูลที่ถูกรวม (Merge) แล้วกลับลงฐานข้อมูล
	return s.queries.UpdateBoard(ctx, db.UpdateBoardParams{
		ID:     id,
		Title:  newTitle,
		Budget: newBudget,
	})
}

func (s *BoardService) GetBoardWithCards(ctx context.Context, boardID pgtype.UUID) ([]ColumnData, error) {
	columns, err := s.queries.GetColumnsByBoardID(ctx, boardID)
	if err != nil {
		return nil, fmt.Errorf("fetch columns: %w", err)
	}

	columnIDs := make([]pgtype.UUID, len(columns))
	for i, col := range columns {
		columnIDs[i] = col.ID
	}

	cards, err := s.queries.GetCardsByColumnIDs(ctx, columnIDs)
	if err != nil {
		return nil, fmt.Errorf("fetch cards: %w", err)
	}

	cardsByColumn := make(map[pgtype.UUID][]CardData, len(columns))
	for _, card := range cards {
		cardsByColumn[card.ColumnID] = append(cardsByColumn[card.ColumnID], CardData{
			ID:           card.ID,
			ColumnID:     card.ColumnID,
			Title:        card.Title,
			Description:  card.Description,
			Position:     card.Position,
			DueDate:      card.DueDate,
			AssigneeID:   card.AssigneeID,
			AssigneeName: card.AssigneeName,
			Priority:     card.Priority,
		})
	}

	result := make([]ColumnData, 0, len(columns))
	for _, col := range columns {
		result = append(result, ColumnData{
			ID:       col.ID,
			Title:    col.Title,
			Position: col.Position,
			Cards:    cardsByColumn[col.ID],
		})
	}

	return result, nil
}

func (s *BoardService) UpdateCard(ctx context.Context, arg UpdateCardParams) (db.Card, error) {
	card, err := s.queries.UpdateCard(ctx, db.UpdateCardParams{
		ID:             arg.ID,
		Title:          arg.Title.String,
		Description:    arg.Description,
		DueDate:        arg.DueDate,
		AssigneeID:     arg.AssigneeID,
		Priority:       arg.Priority,
		EstimatedHours: arg.EstimatedHours,
	})
	if err != nil {
		return db.Card{}, fmt.Errorf("update card: %w", err)
	}
	return card, nil
}
