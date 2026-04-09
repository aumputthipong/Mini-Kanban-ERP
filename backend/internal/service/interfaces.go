package service

import (
	"context"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
)

// BoardServicer ครอบคลุมทุก method ที่ handler ใช้จาก *BoardService
// *BoardService implement interface นี้โดยอัตโนมัติ (Go implicit interface)
type BoardServicer interface {
	// Board
	GetAllBoards(ctx context.Context) ([]db.GetAllActiveBoardsRow, error)
	GetBoardWithCards(ctx context.Context, boardID string) ([]ColumnData, error)
	CreateBoard(ctx context.Context, title string, ownerID string) (string, error)
	UpdateBoard(ctx context.Context, id string, title *string, budget *float64) (db.Board, error)
	MoveBoardToTrash(ctx context.Context, boardID string) error
	GetTrashedBoards(ctx context.Context) ([]db.GetTrashedBoardsRow, error)
	HardDeleteBoard(ctx context.Context, id string) error

	// Member
	GetBoardMembers(ctx context.Context, boardID string) ([]db.GetBoardMembersRow, error)
	AddBoardMember(ctx context.Context, boardID, userID, role string) error
	RemoveBoardMember(ctx context.Context, boardID, userID string) error
	UpdateMemberRole(ctx context.Context, boardID, userID string, role string) error

	// Card
	GetCard(ctx context.Context, cardID string) (db.Card, error)
	CreateCard(ctx context.Context, arg db.CreateCardParams) (db.CreateCardRow, error)
	UpdateCard(ctx context.Context, arg UpdateCardParams) (db.Card, error)

	// User
	GetAllUsers(ctx context.Context) ([]db.GetAllUsersRow, error)
}

// SubtaskServicer ครอบคลุมทุก method ที่ SubtaskHandler ใช้จาก *SubtaskService
type SubtaskServicer interface {
	CreateSubtask(ctx context.Context, arg db.CreateSubtaskParams) (db.CardSubtask, error)
	GetSubtasksByCardID(ctx context.Context, cardID string) ([]db.CardSubtask, error)
	UpdateSubtask(ctx context.Context, subtaskID string, req dto.UpdateSubtaskRequest) (db.CardSubtask, error)
	DeleteSubtask(ctx context.Context, subtaskID string) error
	GetSubtaskByID(ctx context.Context, subtaskID string) (db.CardSubtask, error)
}

// AuthServicer ครอบคลุมทุก method ที่ AuthHandler ใช้จาก *AuthService
type AuthServicer interface {
	Register(ctx context.Context, arg RegisterParams) (db.User, error)
	Login(ctx context.Context, email, password string) (db.User, error)
	UpsertOAuthUser(ctx context.Context, email, fullName, provider, providerID string) (db.User, error)
}
