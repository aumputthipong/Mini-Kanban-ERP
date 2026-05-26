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

// PlanningServicer is the contract used by the planning handler. Sessions are
// the meeting-notes container; items are the REQ/DEC/Q rows inside a session.
// All board-scope checks happen in the handler via boardID resolved through
// GetSessionBoardID / GetItemBoardID — the service trusts its caller did the
// permission gate.
type PlanningServicer interface {
	ListSessionsByBoard(ctx context.Context, boardID string) ([]db.ListPlanningSessionsByBoardRow, error)
	GetSession(ctx context.Context, sessionID string) (db.PlanningSession, error)
	GetSessionBoardID(ctx context.Context, sessionID string) (string, error)
	GetItem(ctx context.Context, itemID string) (db.PlanningItem, error)
	GetItemBoardID(ctx context.Context, itemID string) (string, error)
	ListItems(ctx context.Context, sessionID string) ([]db.PlanningItem, error)
	CreateSession(ctx context.Context, boardID, title string, label, meetingAt *string, createdBy string) (db.PlanningSession, error)
	UpdateSession(ctx context.Context, sessionID string, title, label, meetingAt *string) (db.PlanningSession, error)
	DeleteSession(ctx context.Context, sessionID string) error
	CreateItem(ctx context.Context, sessionID, itemType, title string, description *string) (db.PlanningItem, error)
	UpdateItem(ctx context.Context, itemID string, itemType, title *string, description *string, status *string, position *float64) (db.PlanningItem, error)
	DeleteItem(ctx context.Context, itemID string) error
	PromoteItem(ctx context.Context, itemID, userID string) (db.PlanningItem, db.CreateCardRow, error)
	GetCardSource(ctx context.Context, cardID string, pendingLimit int32) (*CardSource, error)
}

// ActivityRecorder is the narrow contract handlers need to log audit events.
// Both the real *ActivityService and test spies implement it. Kept as a
// separate interface (not part of a wider ActivityServicer) so handlers don't
// pull in the read-side methods they never touch.
type ActivityRecorder interface {
	Record(ctx context.Context, p RecordParams) (db.Activity, error)
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
