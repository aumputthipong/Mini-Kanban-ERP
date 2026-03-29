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

func (s *BoardService) GetAllBoards(ctx context.Context) ([]db.GetAllBoardsRow, error) {
	return s.queries.GetAllBoards(ctx)
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