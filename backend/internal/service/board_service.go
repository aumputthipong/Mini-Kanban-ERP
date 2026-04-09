// internal/service/board_service.go
package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/util"
	"github.com/jackc/pgx/v5/pgxpool"
)

type BoardService struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

// ColumnData และ CardData ใช้ string สำหรับ ID แทน uuid.UUID
// เพราะ sqlc generate ออกมาเป็น string อยู่แล้ว ไม่ต้องแปลงซ้ำ
type ColumnData struct {
	ID       string
	Title    string
	Position float64
	Category string
	Cards    []CardData
}

type SubtaskData struct {
	ID       string
	CardID   string
	Title    string
	IsDone   bool
	Position float64
}

type CardData struct {
	ID                string
	ColumnID          string
	Title             string
	Description       *string
	Position          float64
	DueDate           *time.Time
	EstimatedHours    *float64
	AssigneeID        *string
	AssigneeName      *string
	Priority          *string
	IsDone            bool
	CompletedAt       *time.Time
	CreatedBy         *string
	Subtasks          []SubtaskData
	TotalSubtasks     int64
	CompletedSubtasks int64
}

type BoardSummaryData struct {
	ID         string
	Title      string
	UpdatedAt  time.Time
	TotalCards int
	DoneCards  int
	Members    []dto.MemberSummary
}

func NewBoardService(pool *pgxpool.Pool, queries *db.Queries) *BoardService {
	return &BoardService{
		pool:    pool,
		queries: queries,
	}
}

// CreateBoard สร้าง board ใหม่พร้อม 3 columns เริ่มต้น และกำหนด ownerID เป็น owner
// รับและคืน string แทน uuid.UUID เพื่อให้ตรงกับ type จาก sqlc
func (s *BoardService) CreateBoard(ctx context.Context, title string, ownerID string) (string, error) {
	if strings.TrimSpace(title) == "" {
		return "", fmt.Errorf("board title cannot be empty")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return "", fmt.Errorf("begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	qtx := s.queries.WithTx(tx)

	board, err := qtx.CreateBoard(ctx, title)
	if err != nil {
		return "", fmt.Errorf("create board: %w", err)
	}

	defaultColumns := []struct {
		Title    string
		Position float64
		Category string
	}{
		{"To Do", 65536.0, "TODO"},
		{"In Progress", 131072.0, "TODO"},
		{"Review", 196608.0, "TODO"},
		{"Done", 262144.0, "DONE"},
	}

	for _, col := range defaultColumns {
		_, err := qtx.CreateColumn(ctx, db.CreateColumnParams{
			BoardID:  board.ID,
			Title:    col.Title,
			Position: col.Position,
			Category: col.Category,
		})
		if err != nil {
			return "", fmt.Errorf("create column %q: %w", col.Title, err)
		}
	}

	if _, err := qtx.AddBoardMember(ctx, db.AddBoardMemberParams{
		BoardID: board.ID,
		UserID:  ownerID,
		Role:    "owner",
	}); err != nil {
		return "", fmt.Errorf("add owner to board: %w", err)
	}

	if err := tx.Commit(ctx); err != nil {
		return "", fmt.Errorf("commit tx: %w", err)
	}

	return board.ID, nil
}

func (s *BoardService) GetAllBoards(ctx context.Context) ([]BoardSummaryData, error) {
	stats, err := s.queries.GetActiveBoardsWithStats(ctx)
	if err != nil {
		return nil, err
	}

	memberRows, err := s.queries.GetMembersForActiveBoards(ctx)
	if err != nil {
		return nil, err
	}

	// group members by board ID
	membersByBoard := make(map[string][]dto.MemberSummary, len(stats))
	for _, m := range memberRows {
		membersByBoard[m.BoardID] = append(membersByBoard[m.BoardID], dto.MemberSummary{
			UserID:   m.UserID,
			FullName: m.FullName,
		})
	}

	result := make([]BoardSummaryData, 0, len(stats))
	for _, b := range stats {
		members := membersByBoard[b.ID]
		if members == nil {
			members = []dto.MemberSummary{}
		}
		result = append(result, BoardSummaryData{
			ID:         b.ID,
			Title:      b.Title,
			UpdatedAt:  b.UpdatedAt.Time,
			TotalCards: int(b.TotalCards),
			DoneCards:  int(b.DoneCards),
			Members:    members,
		})
	}
	return result, nil
}

func (s *BoardService) GetColumnsByBoardID(ctx context.Context, boardID string) ([]db.Column, error) {
	return s.queries.GetColumnsByBoardID(ctx, boardID)
}

func (s *BoardService) MoveBoardToTrash(ctx context.Context, boardID string) error {
	return s.queries.MoveBoardToTrash(ctx, boardID)
}

func (s *BoardService) GetTrashedBoards(ctx context.Context) ([]db.GetTrashedBoardsRow, error) {
	return s.queries.GetTrashedBoards(ctx)
}

func (s *BoardService) HardDeleteBoard(ctx context.Context, id string) error {
	return s.queries.HardDeleteBoard(ctx, id)
}

func (s *BoardService) UpdateBoard(ctx context.Context, id string, title *string, budget *float64) (db.Board, error) {
	existingBoard, err := s.queries.GetBoardByID(ctx, id)
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
		ID:     id,
		Title:  newTitle,
		Budget: newBudget,
	})
}

// GetBoardWithCards ดึง columns, cards และ subtasks ทั้งหมดของ board ใน 3 queries
func (s *BoardService) GetBoardWithCards(ctx context.Context, boardID string) ([]ColumnData, error) {
	ctx, cancel := context.WithTimeout(ctx, 10*time.Second)
	defer cancel()

	// 1. ดึงข้อมูล Columns
	columns, err := s.queries.GetColumnsByBoardID(ctx, boardID)
	if err != nil {
		return nil, fmt.Errorf("fetch columns: %w", err)
	}

	// 🌟 Best Practice: ตรวจสอบความว่างเปล่า (Early Return)
	// ถ้าบอร์ดนี้ยังไม่มี Column เลย ให้ส่ง Array ว่างกลับไปทันที
	if len(columns) == 0 {
		return []ColumnData{}, nil
	}

	columnIDs := make([]string, len(columns))
	for i, col := range columns {
		columnIDs[i] = col.ID
	}

	// 2. ดึงข้อมูล Cards 
	// (ถึงบรรทัดนี้ การันตีได้แล้วว่า columnIDs มีค่าอย่างน้อย 1 ตัวแน่นอน)
	cards, err := s.queries.GetCardsByColumnIDs(ctx, columnIDs)
	if err != nil {
		return nil, fmt.Errorf("fetch cards: %w", err)
	}

	cardsByColumn := make(map[string][]CardData)
	for _, card := range cards {
		cardsByColumn[card.ColumnID] = append(cardsByColumn[card.ColumnID], CardData{
			ID:                card.ID,
			ColumnID:          card.ColumnID,
			Title:             card.Title,
			Description:       card.Description,
			Position:          card.Position,
			DueDate:           card.DueDate,
			EstimatedHours:    util.PgNumericToFloat64Ptr(card.EstimatedHours),
			AssigneeID:        card.AssigneeID,
			AssigneeName:      card.AssigneeName,
			Priority:          card.Priority,
			IsDone:            card.IsDone,
			CompletedAt:       util.TimestamptzToTimePtr(card.CompletedAt),
			CreatedBy:         card.CreatedBy,
			TotalSubtasks:     card.TotalSubtasks,
			CompletedSubtasks: card.CompletedSubtasks,
		})
	}

	result := make([]ColumnData, 0, len(columns))
	for _, col := range columns {
		// 🌟 Best Practice: เช็คค่า nil ของ map
		// ถ้า Column นั้นไม่มี Card เลย map จะคืนค่า nil 
		// เราควรแปลงเป็น Slice ว่าง []CardData{} แทนที่ Frontend จะได้รับเป็น null
		colCards := cardsByColumn[col.ID]
		if colCards == nil {
			colCards = []CardData{}
		}

		result = append(result, ColumnData{
			ID:       col.ID,
			Title:    col.Title,
			Position: col.Position,
			Category: col.Category,
			Cards:    colCards,
		})
	}

	return result, nil
}
