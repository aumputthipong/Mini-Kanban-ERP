package service

import (
	"context"
	"fmt"
	"strings"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/jackc/pgx/v5/pgxpool"
)

type TagService struct {
	pool    *pgxpool.Pool
	queries *db.Queries
}

func NewTagService(pool *pgxpool.Pool, queries *db.Queries) *TagService {
	return &TagService{pool: pool, queries: queries}
}

func (s *TagService) GetTagsByBoard(ctx context.Context, boardID string) ([]db.Tag, error) {
	return s.queries.GetTagsByBoardID(ctx, boardID)
}

func (s *TagService) CreateTag(ctx context.Context, boardID, name, color string) (db.Tag, error) {
	name = strings.TrimSpace(name)
	if name == "" {
		return db.Tag{}, fmt.Errorf("tag name cannot be empty")
	}
	if len(name) > 50 {
		return db.Tag{}, fmt.Errorf("tag name too long (max 50 chars)")
	}
	return s.queries.CreateTag(ctx, db.CreateTagParams{
		BoardID: boardID,
		Name:    name,
		Color:   color,
	})
}

func (s *TagService) DeleteTag(ctx context.Context, boardID, tagID string) error {
	return s.queries.DeleteTag(ctx, db.DeleteTagParams{ID: tagID, BoardID: boardID})
}
