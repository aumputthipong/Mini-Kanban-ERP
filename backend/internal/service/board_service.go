// internal/service/board_service.go
package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/util"
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

	// 1. เริ่ม Transaction
	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return uuid.Nil, fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// 2. ตรวจสอบตรงนี้: หาก sqlc ของคุณใช้ pgx/v5
	// ตัว WithTx จะรับ pgx.Tx ได้เลย แต่ถ้ามันฟ้อง error *sql.Tx
	// แสดงว่า sqlc ของคุณถูกเจนมาสำหรับ database/sql
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
			BoardID:  board.ID, // board.ID เป็น string อยู่แล้ว (จาก override)
			Title:    col.Title,
			Position: col.Position,
		})
		if err != nil {
			return uuid.Nil, fmt.Errorf("create column %q: %w", col.Title, err)
		}
	}

	if _, err := qtx.AddBoardMember(ctx, db.AddBoardMemberParams{
		BoardID: board.ID,
		UserID:  ownerID.String(),
		Role:    "owner",
	}); err != nil {
		return uuid.Nil, fmt.Errorf("add owner to board: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return uuid.Nil, fmt.Errorf("commit tx: %w", err)
	}

	// 3. แปลง string กลับเป็น uuid.UUID ก่อน return
	return uuid.Parse(board.ID)
}

func (s *BoardService) GetAllBoards(ctx context.Context) ([]db.GetAllActiveBoardsRow, error) {
	// return s.queries.GetAllBoards(ctx)
	return s.queries.GetAllActiveBoards(ctx)
}

func (s *BoardService) GetColumnsByBoardID(ctx context.Context, boardID uuid.UUID) ([]db.Column, error) {
	// แปลง uuid.UUID เป็น string เพื่อให้ตรงกับ sqlc override
	return s.queries.GetColumnsByBoardID(ctx, boardID.String())
}

func (s *BoardService) MoveBoardToTrash(ctx context.Context, boardID uuid.UUID) error {
	// หากมีลอจิกการตรวจสอบสิทธิ์ (เช่น บอร์ดนี้เป็นของ user คนนี้จริงไหม) ให้ใส่ตรงนี้

	err := s.queries.MoveBoardToTrash(ctx, boardID.String())
	if err != nil {
		return err
	}
	return nil
}

func (s *BoardService) GetTrashedBoards(ctx context.Context) ([]db.GetTrashedBoardsRow, error) {
	return s.queries.GetTrashedBoards(ctx)
}

func (s *BoardService) HardDeleteBoard(ctx context.Context, id uuid.UUID) error {
	return s.queries.HardDeleteBoard(ctx, id.String())
}

func (s *BoardService) UpdateBoard(ctx context.Context, id uuid.UUID, title *string, budget *float64) (db.Board, error) {

	existingBoard, err := s.queries.GetBoardByID(ctx, id.String())
	if err != nil {
		return db.Board{}, err
	}

	newTitle := existingBoard.Title
	newBudget := existingBoard.Budget

	if title != nil {
		newTitle = *title
	}

if budget != nil {
        newBudget = util.PtrFloatToPgNumeric(budget)
    }
	return s.queries.UpdateBoard(ctx, db.UpdateBoardParams{
		ID:     id.String(),
		Title:  newTitle,
		Budget: newBudget,
	})
}

func (s *BoardService) GetBoardWithCards(ctx context.Context, boardID uuid.UUID) ([]ColumnData, error) {
	columns, err := s.queries.GetColumnsByBoardID(ctx, boardID.String())
	if err != nil {
		return nil, fmt.Errorf("fetch columns: %w", err)
	}

	columnIDs := make([]string, len(columns))
	for i, col := range columns {
		columnIDs[i] = col.ID
	}

	cards, err := s.queries.GetCardsByColumnIDs(ctx, columnIDs)
	if err != nil {
		return nil, fmt.Errorf("fetch cards: %w", err)
	}

	cardsByColumn := make(map[string][]CardData)
	for _, card := range cards {
		cardsByColumn[card.ColumnID] = append(cardsByColumn[card.ColumnID], CardData{
			ID:          uuid.MustParse(card.ID),
			ColumnID:    uuid.MustParse(card.ColumnID),
			Title:       card.Title,
			Description: card.Description, // เป็น *string มาจาก DB แล้ว ใส่ได้เลย
			Position:    card.Position,

			// ใช้ Helper ตัวใหม่สำหรับ pgx
			DueDate:    util.PgDateToTimePtr(card.DueDate),
			AssigneeID: util.PgUUIDToUUIDPtr(card.AssigneeID),

			AssigneeName: card.AssigneeName, // เป็น *string ใส่ได้เลย
			Priority:     card.Priority,     // เป็น *string ใส่ได้เลย
		})
	}
	// 5. ประกอบร่าง Result
	result := make([]ColumnData, 0, len(columns))
	for _, col := range columns {
		result = append(result, ColumnData{
			ID:       uuid.MustParse(col.ID),
			Title:    col.Title,
			Position: col.Position,
			Cards:    cardsByColumn[col.ID],
		})
	}

	return result, nil
}
