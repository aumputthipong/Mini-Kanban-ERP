package service

import (
	"context"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/google/uuid"
	
)
type BoardMember struct {
	ID       uuid.UUID
	Role     string
	UserID   uuid.UUID
	Email    string
	FullName string
}



func (s *BoardService) GetBoardMembers(ctx context.Context, boardID uuid.UUID) ([]db.GetBoardMembersRow, error) {
	return s.queries.GetBoardMembers(ctx, boardID.String())
}

func (s *BoardService) AddBoardMember(ctx context.Context, boardID, userID uuid.UUID, role string) error {
	_, err := s.queries.AddBoardMember(ctx, db.AddBoardMemberParams{
		BoardID: boardID.String(),
		UserID:  userID.String(),
		Role:    role,
	})
	return err
}

func (s *BoardService) RemoveBoardMember(ctx context.Context, boardID, userID uuid.UUID) error {
	return s.queries.RemoveBoardMember(ctx, db.RemoveBoardMemberParams{
		BoardID: boardID.String(),
		UserID:  userID.String(),
	})
}

func (s *BoardService) UpdateMemberRole(ctx context.Context, boardID, userID uuid.UUID, role string) error {
	_, err := s.queries.UpdateBoardMemberRole(ctx, db.UpdateBoardMemberRoleParams{
		BoardID: boardID.String(),
		UserID:  userID.String(),
		Role:    role,
	})
	return err
}
