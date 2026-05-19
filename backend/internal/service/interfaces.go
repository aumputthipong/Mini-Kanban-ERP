// Package service holds the business-logic layer: it owns transactions,
// permission checks beyond simple membership/role gates, and the mapping
// between sqlc-generated DB rows and the domain types handlers consume.
//
// Each *Service struct is paired with a *Servicer interface so handlers
// depend on the interface and can be tested with the generated mocks in
// internal/service/mock.
package service

import (
	"context"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/dto"
)

// BoardServicer is the contract used by board / card / my-tasks / member
// handlers. *BoardService satisfies it implicitly. Mocks for testing live
// in internal/service/mock.
type BoardServicer interface {
	// Board
	GetAllBoards(ctx context.Context, userID string) ([]BoardSummaryData, error)
	GetBoardWithCards(ctx context.Context, boardID string) ([]ColumnData, error)
	CreateBoard(ctx context.Context, title string, ownerID string) (string, error)
	UpdateBoard(ctx context.Context, id string, title *string, budget *float64) (db.Board, error)
	MoveBoardToTrash(ctx context.Context, boardID string) error
	GetTrashedBoards(ctx context.Context, userID string) ([]db.GetTrashedBoardsForOwnerRow, error)
	HardDeleteBoard(ctx context.Context, id string) error
	RestoreBoard(ctx context.Context, id string) error
	GetBoardMemberRole(ctx context.Context, boardID, userID string) (string, error)
	GetBoardIDByColumn(ctx context.Context, columnID string) (string, error)
	GetBoardIDByCard(ctx context.Context, cardID string) (string, error)

	// My Tasks
	GetMyTasks(ctx context.Context, userID string) ([]MyTaskData, error)
	CompleteMyTask(ctx context.Context, cardID, userID string) (bool, error)

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

// SubtaskServicer is the contract for the subtask handler. CRUD against
// card_subtasks rows, scoped to a parent card.
type SubtaskServicer interface {
	CreateSubtask(ctx context.Context, arg db.CreateSubtaskParams) (db.CardSubtask, error)
	GetSubtasksByCardID(ctx context.Context, cardID string) ([]db.CardSubtask, error)
	UpdateSubtask(ctx context.Context, subtaskID string, req dto.UpdateSubtaskRequest) (db.CardSubtask, error)
	DeleteSubtask(ctx context.Context, subtaskID string) error
	GetSubtaskByID(ctx context.Context, subtaskID string) (db.CardSubtask, error)
}

// AuthServicer is the contract for credential and OAuth-based authentication.
// Token issuance lives in the token package, not here — service only resolves
// the user identity.
type AuthServicer interface {
	Register(ctx context.Context, arg RegisterParams) (db.User, error)
	Login(ctx context.Context, email, password string) (db.User, error)
	UpsertOAuthUser(ctx context.Context, email, fullName, provider, providerID string) (db.User, error)
	GetUserByID(ctx context.Context, userID string) (db.GetUserByIDRow, error)
	IssueRefreshToken(ctx context.Context, userID, userAgent, ip string) (string, error)
	RotateRefreshToken(ctx context.Context, rawToken, userAgent, ip string) (RefreshRotationResult, error)
	RevokeRefreshToken(ctx context.Context, rawToken string) error
}
