// internal/service/board_service.go
package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/pgutil"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BoardService struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}


type ColumnData struct {
	ID       uuid.UUID
	Title    string
	Position float64
	Cards    []CardData
}


func NewBoardService(pool *pgxpool.Pool, queries *db.Queries) *BoardService {
	return &BoardService{
		pool:    pool,
		queries: queries,
	}
}

func (s *BoardService) CreateBoard(ctx context.Context, title string, ownerID uuid.UUID) (uuid.UUID, error) {
	if strings.TrimSpace(title) == "" {
		return uuid.Nil, fmt.Errorf("board title cannot be empty")
	}

	// 1. ใช้ s.pool.Begin แทน s.db.BeginTx
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return uuid.Nil, fmt.Errorf("begin tx: %w", err)
	}

	// 2. Rollback ต้องส่ง ctx เข้าไปด้วย
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	board, err := qtx.CreateBoard(ctx, title)
	if err != nil {
		return uuid.Nil, fmt.Errorf("create board: %w", err)
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
		_, err := qtx.CreateColumn(ctx, db.CreateColumnParams{
			BoardID:  board.ID,
			Title:    col.Title,
			Position: col.Position,
		})
		if err != nil {
			return uuid.Nil, fmt.Errorf("create column %q: %w", col.Title, err)
		}
	}

	if _, err := qtx.AddBoardMember(ctx, db.AddBoardMemberParams{
		BoardID: board.ID,
		UserID:  ownerID,
		Role:    "owner",
	}); err != nil {
		return uuid.Nil, fmt.Errorf("add owner to board: %w", err)
	}

	// 3. Commit ต้องส่ง ctx เข้าไปด้วย
	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, fmt.Errorf("commit tx: %w", err)
	}

	return board.ID, nil
}

func (s *BoardService) GetAllBoards(ctx context.Context) ([]db.GetAllActiveBoardsRow, error) {
	// return s.queries.GetAllBoards(ctx)
	return s.queries.GetAllActiveBoards(ctx)
}

func (s *BoardService) GetColumnsByBoardID(ctx context.Context, boardID uuid.UUID) ([]db.Column, error) {
	return s.queries.GetColumnsByBoardID(ctx, boardID)
}

func (s *BoardService) MoveBoardToTrash(ctx context.Context, boardID uuid.UUID) error {
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

func (s *BoardService) HardDeleteBoard(ctx context.Context, id uuid.UUID) error {
	return s.queries.HardDeleteBoard(ctx, id)
}

// เปลี่ยน Parameter ให้รับเป็น Pointer
func (s *BoardService) UpdateBoard(ctx context.Context, id uuid.UUID, title *string, budget *float64) (db.Board, error) {

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

func (s *BoardService) GetBoardWithCards(ctx context.Context, boardID uuid.UUID) ([]ColumnData, error) {
	columns, err := s.queries.GetColumnsByBoardID(ctx, boardID)
	if err != nil {
		return nil, fmt.Errorf("fetch columns: %w", err)
	}

	columnIDs := make([]uuid.UUID, len(columns))
	for i, col := range columns {
		columnIDs[i] = col.ID
	}

	cards, err := s.queries.GetCardsByColumnIDs(ctx, columnIDs)
	if err != nil {
		return nil, fmt.Errorf("fetch cards: %w", err)
	}

	cardsByColumn := make(map[uuid.UUID][]CardData, len(columns))
	for _, card := range cards {
		cardsByColumn[card.ColumnID] = append(cardsByColumn[card.ColumnID], CardData{
			ID:          card.ID,
			ColumnID:    card.ColumnID,
			Title:       card.Title,
			Description: pgutil.TextToPtr(card.Description),
			Position:    card.Position,
			DueDate:     pgutil.DateToTimePtr(card.DueDate),
			AssigneeID: pgutil.PgUUIDToPtr(card.AssigneeID),

			AssigneeName: pgutil.TextToPtr(card.AssigneeName),
			Priority:     pgutil.TextToPtr(card.Priority),
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

