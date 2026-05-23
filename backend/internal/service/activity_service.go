package service

import (
	"context"
	"encoding/json"
	"log/slog"
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

	// Planning section. Sessions hold meeting notes; items are the REQ/DEC/Q
	// rows inside a session. PromoteItem turns an item into a Kanban card —
	// we log only the planning side (planning.item_promoted) to avoid
	// duplicating the card-created noise on the audit feed.
	EventPlanningSessionCreated = "planning.session_created"
	EventPlanningSessionUpdated = "planning.session_updated"
	EventPlanningSessionDeleted = "planning.session_deleted"
	EventPlanningItemCreated    = "planning.item_created"
	EventPlanningItemUpdated    = "planning.item_updated"
	EventPlanningItemDeleted    = "planning.item_deleted"
	EventPlanningItemPromoted   = "planning.item_promoted"

	EntityCard            = "card"
	EntityColumn          = "column"
	EntityMember          = "member"
	EntityPlanningSession = "planning_session"
	EntityPlanningItem    = "planning_item"
)

type ActivityService struct {
	queries *db.Queries
	jobs    chan RecordParams
	stop    chan struct{}
}

const (
	activityQueueSize  = 512
	activityWriteTimeout = 5 * time.Second
)

func NewActivityService(queries *db.Queries) *ActivityService {
	s := &ActivityService{
		queries: queries,
		jobs:    make(chan RecordParams, activityQueueSize),
		stop:    make(chan struct{}),
	}
	go s.worker()
	return s
}

// worker drains queued RecordAsync jobs. Each job runs with a fresh background
// context so a slow audit insert doesn't get cancelled when the HTTP request
// that scheduled it returns. On Stop we drain whatever's still in the buffer
// then return; new sends after Stop are dropped (see RecordAsync).
func (s *ActivityService) worker() {
	for {
		select {
		case <-s.stop:
			for {
				select {
				case p := <-s.jobs:
					s.writeOne(p)
				default:
					return
				}
			}
		case p := <-s.jobs:
			s.writeOne(p)
		}
	}
}

func (s *ActivityService) writeOne(p RecordParams) {
	ctx, cancel := context.WithTimeout(context.Background(), activityWriteTimeout)
	defer cancel()
	if _, err := s.Record(ctx, p); err != nil {
		slog.Warn("async activity record failed", "event_type", p.EventType, "err", err)
	}
}

// Stop signals the worker to drain and exit. Idempotent. Call once at
// graceful shutdown after the HTTP listener has drained.
func (s *ActivityService) Stop() {
	select {
	case <-s.stop:
	default:
		close(s.stop)
	}
}

// RecordAsync enqueues an audit insert and returns immediately. Use it from
// REST mutation handlers where the response shouldn't be held up by the audit
// row's round-trip. If the queue is full the job is dropped with a warning —
// audit is best-effort by design (see AGENTS.md).
//
// Do NOT use this from the WebSocket path: the broadcast payload uses the
// returned activity's ID and created_at, so that path needs Record's sync
// return.
func (s *ActivityService) RecordAsync(p RecordParams) {
	select {
	case s.jobs <- p:
	default:
		slog.Warn("activity queue full, dropping record", "event_type", p.EventType)
	}
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

// Planning payloads. Item-level events carry both title and type so the
// feed can render "REQ: Add 2FA" without re-fetching the row. The Updated
// payloads include a `fields` slice (same shape as CardUpdatedPayload) so
// one event covers any partial PATCH — drop/undrop/select/rename/retype
// all fold into "planning.item_updated" with fields=["status"] etc.
type PlanningSessionCreatedPayload struct {
	Title string `json:"title"`
}

type PlanningSessionUpdatedPayload struct {
	Title  string   `json:"title"`
	Fields []string `json:"fields"`
}

type PlanningSessionDeletedPayload struct {
	Title string `json:"title"`
}

type PlanningItemCreatedPayload struct {
	Type  string `json:"type"`
	Title string `json:"title"`
}

type PlanningItemUpdatedPayload struct {
	Type   string   `json:"type"`
	Title  string   `json:"title"`
	Fields []string `json:"fields"`
}

type PlanningItemDeletedPayload struct {
	Type  string `json:"type"`
	Title string `json:"title"`
}

type PlanningItemPromotedPayload struct {
	Type      string `json:"type"`
	Title     string `json:"title"`
	ToCardID  string `json:"to_card_id"`
}
