package mock

import (
	"context"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
)

// MockBoardService implements service.BoardServicer
// ใช้ pattern "function field" — กำหนดพฤติกรรมแต่ละ test ได้โดยตรง
//
// ตัวอย่างการใช้:
//
//	mock := &mock.MockBoardService{
//	    GetAllBoardsFn: func(ctx context.Context) ([]service.BoardSummaryData, error) {
//	        return []service.BoardSummaryData{{ID: "abc", Title: "Test"}}, nil
//	    },
//	}
type MockBoardService struct {
	GetAllBoardsFn       func(ctx context.Context, userID string) ([]service.BoardSummaryData, error)
	GetBoardWithCardsFn  func(ctx context.Context, boardID string) ([]service.ColumnData, error)
	CreateBoardFn        func(ctx context.Context, title string, ownerID string) (string, error)
	UpdateBoardFn        func(ctx context.Context, id string, title *string, budget *float64) (db.Board, error)
	MoveBoardToTrashFn   func(ctx context.Context, boardID string) error
	GetTrashedBoardsFn   func(ctx context.Context, userID string) ([]db.GetTrashedBoardsForOwnerRow, error)
	HardDeleteBoardFn    func(ctx context.Context, id string) error
	RestoreBoardFn       func(ctx context.Context, id string) error
	GetBoardMemberRoleFn func(ctx context.Context, boardID, userID string) (string, error)

	GetBoardMembersFn  func(ctx context.Context, boardID string) ([]db.GetBoardMembersRow, error)
	AddBoardMemberFn   func(ctx context.Context, boardID, userID, role string) error
	RemoveBoardMemberFn func(ctx context.Context, boardID, userID string) error
	UpdateMemberRoleFn func(ctx context.Context, boardID, userID string, role string) error

	GetCardFn    func(ctx context.Context, cardID string) (db.Card, error)
	CreateCardFn func(ctx context.Context, arg db.CreateCardParams) (db.CreateCardRow, error)
	UpdateCardFn func(ctx context.Context, arg service.UpdateCardParams) (db.Card, error)

	GetAllUsersFn func(ctx context.Context) ([]db.GetAllUsersRow, error)
}

func (m *MockBoardService) GetAllBoards(ctx context.Context, userID string) ([]service.BoardSummaryData, error) {
	return m.GetAllBoardsFn(ctx, userID)
}

func (m *MockBoardService) GetBoardWithCards(ctx context.Context, boardID string) ([]service.ColumnData, error) {
	return m.GetBoardWithCardsFn(ctx, boardID)
}

func (m *MockBoardService) CreateBoard(ctx context.Context, title string, ownerID string) (string, error) {
	return m.CreateBoardFn(ctx, title, ownerID)
}

func (m *MockBoardService) UpdateBoard(ctx context.Context, id string, title *string, budget *float64) (db.Board, error) {
	return m.UpdateBoardFn(ctx, id, title, budget)
}

func (m *MockBoardService) MoveBoardToTrash(ctx context.Context, boardID string) error {
	return m.MoveBoardToTrashFn(ctx, boardID)
}

func (m *MockBoardService) GetTrashedBoards(ctx context.Context, userID string) ([]db.GetTrashedBoardsForOwnerRow, error) {
	return m.GetTrashedBoardsFn(ctx, userID)
}

func (m *MockBoardService) GetBoardMemberRole(ctx context.Context, boardID, userID string) (string, error) {
	return m.GetBoardMemberRoleFn(ctx, boardID, userID)
}

func (m *MockBoardService) HardDeleteBoard(ctx context.Context, id string) error {
	return m.HardDeleteBoardFn(ctx, id)
}

func (m *MockBoardService) RestoreBoard(ctx context.Context, id string) error {
	return m.RestoreBoardFn(ctx, id)
}

func (m *MockBoardService) GetBoardMembers(ctx context.Context, boardID string) ([]db.GetBoardMembersRow, error) {
	return m.GetBoardMembersFn(ctx, boardID)
}

func (m *MockBoardService) AddBoardMember(ctx context.Context, boardID, userID, role string) error {
	return m.AddBoardMemberFn(ctx, boardID, userID, role)
}

func (m *MockBoardService) RemoveBoardMember(ctx context.Context, boardID, userID string) error {
	return m.RemoveBoardMemberFn(ctx, boardID, userID)
}

func (m *MockBoardService) UpdateMemberRole(ctx context.Context, boardID, userID string, role string) error {
	return m.UpdateMemberRoleFn(ctx, boardID, userID, role)
}

func (m *MockBoardService) GetCard(ctx context.Context, cardID string) (db.Card, error) {
	return m.GetCardFn(ctx, cardID)
}

func (m *MockBoardService) CreateCard(ctx context.Context, arg db.CreateCardParams) (db.CreateCardRow, error) {
	return m.CreateCardFn(ctx, arg)
}

func (m *MockBoardService) UpdateCard(ctx context.Context, arg service.UpdateCardParams) (db.Card, error) {
	return m.UpdateCardFn(ctx, arg)
}

func (m *MockBoardService) GetAllUsers(ctx context.Context) ([]db.GetAllUsersRow, error) {
	return m.GetAllUsersFn(ctx)
}
