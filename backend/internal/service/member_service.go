package service

import (
	"context"
	"fmt"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
)

type BoardMember struct {
	ID       string
	Role     string
	UserID   string
	Email    string
	FullName string
}

func (s *BoardService) GetBoardMembers(ctx context.Context, boardID string) ([]db.GetBoardMembersRow, error) {
	return s.queries.GetBoardMembers(ctx, boardID)
}

func (s *BoardService) AddBoardMember(ctx context.Context, boardID, userID string, role string) error {
	_, err := s.queries.AddBoardMember(ctx, db.AddBoardMemberParams{
		BoardID: boardID,
		UserID:  userID,
		Role:    role,
	})
	return err
}

func (s *BoardService) RemoveBoardMember(ctx context.Context, boardID, userID string) error {
	role, err := s.queries.GetBoardMemberRole(ctx, db.GetBoardMemberRoleParams{
		BoardID: boardID,
		UserID:  userID,
	})
	if err != nil {
		return err
	}
	if role == "owner" {
		return fmt.Errorf("cannot remove the board owner")
	}
	return s.queries.RemoveBoardMember(ctx, db.RemoveBoardMemberParams{
		BoardID: boardID,
		UserID:  userID,
	})
}

func (s *BoardService) UpdateMemberRole(ctx context.Context, boardID, userID string, role string) error {
	currentRole, err := s.queries.GetBoardMemberRole(ctx, db.GetBoardMemberRoleParams{
		BoardID: boardID,
		UserID:  userID,
	})
	if err != nil {
		return err
	}
	if currentRole == "owner" {
		return fmt.Errorf("cannot change the role of the board owner")
	}
	_, err = s.queries.UpdateBoardMemberRole(ctx, db.UpdateBoardMemberRoleParams{
		BoardID: boardID,
		UserID:  userID,
		Role:    role,
	})
	return err
}
