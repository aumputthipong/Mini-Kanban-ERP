package service

import (
	"context"
	"log"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/jackc/pgx/v5/pgtype"
)

// BoardService ทำหน้าที่จัดการ Business Logic ของ Board
type BoardService struct {
	queries *db.Queries
}

func NewBoardService(queries *db.Queries) *BoardService {
	return &BoardService{
		queries: queries,
	}
}

// CreateBoard สร้างบอร์ดและสร้างคอลัมน์เริ่มต้น (To Do, In Progress, Done)
func (s *BoardService) CreateBoard(ctx context.Context, title string) (pgtype.UUID, error) {
	// 1. สร้าง Board
	board, err := s.queries.CreateBoard(ctx, title)
	if err != nil {
		return pgtype.UUID{}, err
	}

	// 2. สร้างคอลัมน์เริ่มต้น
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
			log.Printf("Warning: Failed to create default column %s for board %s: %v", col.Title, board.ID.String(), err)
		}
	}

	return board.ID, nil
}

// GetAllBoards ดึงข้อมูลบอร์ดทั้งหมด
// เปลี่ยนจาก []db.Board เป็น []db.GetAllBoardsRow
func (s *BoardService) GetAllBoards(ctx context.Context) ([]db.GetAllBoardsRow, error) {
	return s.queries.GetAllBoards(ctx)
}

// --- นำโค้ด 3 ฟังก์ชันนี้ไปต่อท้ายใน board_service.go ---

func (s *BoardService) GetColumnsByBoardID(ctx context.Context, boardID pgtype.UUID) ([]db.Column, error) {
	return s.queries.GetColumnsByBoardID(ctx, boardID)
}

func (s *BoardService) GetCardsByColumnIDs(ctx context.Context, columnIDs []pgtype.UUID) ([]db.Card, error) {
	return s.queries.GetCardsByColumnIDs(ctx, columnIDs)
}

func (s *BoardService) CreateCard(ctx context.Context, arg db.CreateCardParams) (db.CreateCardRow, error) {
	return s.queries.CreateCard(ctx, arg)
}
