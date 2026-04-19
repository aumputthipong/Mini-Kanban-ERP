package service

import (
	"context"
	"encoding/json"
	"time"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
)

const (
	EventCardCreated      = "card.created"
	EventCardMoved        = "card.moved"
	EventCardUpdated      = "card.updated"
	EventCardDeleted      = "card.deleted"
	EventCardDoneToggled  = "card.done_toggled"
	EventColumnCreated    = "column.created"
	EventColumnDeleted    = "column.deleted"
	EventColumnRenamed    = "column.renamed"
	EventMemberAdded      = "member.added"

	EntityCard   = "card"
	EntityColumn = "column"
	EntityMember = "member"
)

type ActivityService struct {
	queries *db.Queries
}

func NewActivityService(queries *db.Queries) *ActivityService {
	return &ActivityService{queries: queries}
}

type RecordParams struct {
	BoardID    string
	ActorID    string
	EventType  string
	EntityType string
	EntityID   *string
	Payload    any
}

func (s *ActivityService) Record(ctx context.Context, p RecordParams) (db.Activity, error) {
	var payloadBytes []byte
	if p.Payload != nil {
		b, err := json.Marshal(p.Payload)
		if err != nil {
			return db.Activity{}, err
		}
		payloadBytes = b
	} else {
		payloadBytes = []byte("{}")
	}
	return s.queries.CreateActivity(ctx, db.CreateActivityParams{
		BoardID:    p.BoardID,
		ActorID:    p.ActorID,
		EventType:  p.EventType,
		EntityType: p.EntityType,
		EntityID:   p.EntityID,
		Payload:    payloadBytes,
	})
}

type ActivityItem struct {
	ID         string
	BoardID    string
	ActorID    string
	ActorName  *string
	EventType  string
	EntityType string
	EntityID   *string
	Payload    []byte
	CreatedAt  time.Time
}

func (s *ActivityService) List(ctx context.Context, boardID string, before *time.Time, limit int32) ([]ActivityItem, error) {
	if limit <= 0 || limit > 100 {
		limit = 30
	}
	if before != nil {
		rows, err := s.queries.ListActivitiesByBoardBefore(ctx, db.ListActivitiesByBoardBeforeParams{
			BoardID:   boardID,
			CreatedAt: *before,
			Limit:     limit,
		})
		if err != nil {
			return nil, err
		}
		out := make([]ActivityItem, len(rows))
		for i, r := range rows {
			out[i] = ActivityItem{
				ID: r.ID, BoardID: r.BoardID, ActorID: r.ActorID, ActorName: r.ActorName,
				EventType: r.EventType, EntityType: r.EntityType, EntityID: r.EntityID,
				Payload: r.Payload, CreatedAt: r.CreatedAt,
			}
		}
		return out, nil
	}
	rows, err := s.queries.ListActivitiesByBoard(ctx, db.ListActivitiesByBoardParams{
		BoardID: boardID,
		Limit:   limit,
	})
	if err != nil {
		return nil, err
	}
	out := make([]ActivityItem, len(rows))
	for i, r := range rows {
		out[i] = ActivityItem{
			ID: r.ID, BoardID: r.BoardID, ActorID: r.ActorID, ActorName: r.ActorName,
			EventType: r.EventType, EntityType: r.EntityType, EntityID: r.EntityID,
			Payload: r.Payload, CreatedAt: r.CreatedAt,
		}
	}
	return out, nil
}

type CardCreatedPayload struct {
	Title    string `json:"title"`
	ColumnID string `json:"column_id"`
}

type CardMovedPayload struct {
	Title        string `json:"title"`
	FromColumnID string `json:"from_column_id"`
	ToColumnID   string `json:"to_column_id"`
}

type CardUpdatedPayload struct {
	Title  string   `json:"title"`
	Fields []string `json:"fields"`
}

type CardDeletedPayload struct {
	Title string `json:"title"`
}

type CardDoneToggledPayload struct {
	Title  string `json:"title"`
	IsDone bool   `json:"is_done"`
}

type ColumnCreatedPayload struct {
	Title string `json:"title"`
}

type ColumnDeletedPayload struct {
	Title string `json:"title"`
}

type ColumnRenamedPayload struct {
	OldTitle string `json:"old_title"`
	NewTitle string `json:"new_title"`
}
