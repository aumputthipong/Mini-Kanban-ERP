//go:build integration

// Integration tests for PlanningService.PromoteItem against a real Postgres.
//
// PromoteItem is the project's only cross-table transactional path
// (planning_items.status flip + cards.insert in one tx). Mocking the DB
// layer can't catch the bugs we actually care about here: a race that
// double-promotes, a partial commit on the cards side, or schema drift
// breaking the TODO-column lookup. These tests use a real container via
// testutil to exercise the actual SQL and concurrency.
package service_test

import (
	"context"
	"errors"
	"sync"
	"testing"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/testutil"
)

// fixture is the seeded data shared by most cases: one board with a TODO
// column, one session, one live REQ item, and the owner user.
type fixture struct {
	pool     *pgxpool.Pool
	seed     *testutil.SeedHelper
	queries  *db.Queries
	svc      *service.PlanningService
	userID   string
	boardID  string
	todoID   string
	sessID   string
	itemID   string
}

func newFixture(t *testing.T) *fixture {
	t.Helper()
	ctx := context.Background()
	pool := testutil.NewTestDB(t)
	seed := testutil.NewSeed(t, pool)
	userID := seed.User(ctx)
	boardID := seed.Board(ctx, userID)
	todoID := seed.Column(ctx, boardID, "TODO", 1)
	sessID := seed.PlanningSession(ctx, boardID, userID)
	itemID := seed.PlanningItem(ctx, sessID)
	return &fixture{
		pool:    pool,
		seed:    seed,
		queries: db.New(pool),
		svc:     service.NewPlanningService(pool, db.New(pool)),
		userID:  userID,
		boardID: boardID,
		todoID:  todoID,
		sessID:  sessID,
		itemID:  itemID,
	}
}

func TestPromoteItem_HappyPath_CreatesCardAndFlipsStatus(t *testing.T) {
	ctx := context.Background()
	f := newFixture(t)

	item, card, err := f.svc.PromoteItem(ctx, f.itemID, f.userID)
	require.NoError(t, err)

	assert.Equal(t, "promoted", item.Status)
	require.NotNil(t, item.PromotedToCardID)
	assert.Equal(t, card.ID, *item.PromotedToCardID)
	assert.Equal(t, f.todoID, card.ColumnID)

	// Card row actually persists with the item's title.
	persisted, err := f.queries.GetCard(ctx, card.ID)
	require.NoError(t, err)
	assert.Equal(t, "Test Item", persisted.Title)
}

func TestPromoteItem_DoublePromote_Returns409SentinelAndDoesNotDuplicate(t *testing.T) {
	ctx := context.Background()
	f := newFixture(t)

	_, card1, err := f.svc.PromoteItem(ctx, f.itemID, f.userID)
	require.NoError(t, err)

	_, _, err = f.svc.PromoteItem(ctx, f.itemID, f.userID)
	require.ErrorIs(t, err, service.ErrPlanningItemAlreadyPromoted)

	// Only one card should exist for this item.
	item, err := f.queries.GetPlanningItem(ctx, f.itemID)
	require.NoError(t, err)
	require.NotNil(t, item.PromotedToCardID)
	assert.Equal(t, card1.ID, *item.PromotedToCardID)
}

func TestPromoteItem_DroppedItem_Returns422Sentinel(t *testing.T) {
	ctx := context.Background()
	f := newFixture(t)

	dropped := "dropped"
	_, err := f.svc.UpdateItem(ctx, f.itemID, nil, nil, nil, &dropped, nil)
	require.NoError(t, err)

	_, _, err = f.svc.PromoteItem(ctx, f.itemID, f.userID)
	require.ErrorIs(t, err, service.ErrPlanningItemDropped)

	// Item status preserved; no card created.
	item, err := f.queries.GetPlanningItem(ctx, f.itemID)
	require.NoError(t, err)
	assert.Equal(t, "dropped", item.Status)
	assert.Nil(t, item.PromotedToCardID)
}

func TestPromoteItem_BoardWithoutTodoColumn_Returns422Sentinel(t *testing.T) {
	ctx := context.Background()
	pool := testutil.NewTestDB(t)
	seed := testutil.NewSeed(t, pool)
	userID := seed.User(ctx)
	boardID := seed.Board(ctx, userID)
	// Intentionally no TODO column — only IN_PROGRESS and DONE.
	seed.Column(ctx, boardID, "IN_PROGRESS", 1)
	seed.Column(ctx, boardID, "DONE", 2)
	sessID := seed.PlanningSession(ctx, boardID, userID)
	itemID := seed.PlanningItem(ctx, sessID)

	svc := service.NewPlanningService(pool, db.New(pool))
	_, _, err := svc.PromoteItem(ctx, itemID, userID)
	require.ErrorIs(t, err, service.ErrPlanningNoTodoColumn)
}

func TestPromoteItem_NotFound_ReturnsSentinel(t *testing.T) {
	ctx := context.Background()
	f := newFixture(t)
	bogusID := "00000000-0000-0000-0000-000000000000"

	_, _, err := f.svc.PromoteItem(ctx, bogusID, f.userID)
	require.ErrorIs(t, err, service.ErrPlanningNotFound)
}

// TestPromoteItem_ConcurrentPromote_ExactlyOneSucceeds is the test that
// motivated this whole infra investment. Without a real DB you cannot
// observe what happens when N goroutines hit PromoteItem on the same
// item at once: the current implementation does a read-check-write
// pattern inside a tx, and Postgres default isolation (READ COMMITTED)
// means two txns can both see status='live' before either commits.
//
// What we expect:
//   - All N goroutines eventually return without panicking.
//   - At least 1 succeeds (item promoted, card created).
//   - The remaining N-1 either succeed-and-create-a-second-card (BUG) or
//     fail with ErrPlanningItemAlreadyPromoted (correct).
//
// This test will FAIL on the current implementation if there's a race —
// that's the bug we want to surface. If it passes, the read-modify-write
// is somehow safe (maybe via row locks we're not seeing in code review),
// and we have confidence.
func TestPromoteItem_ConcurrentPromote_ExactlyOneSucceeds(t *testing.T) {
	ctx := context.Background()
	f := newFixture(t)

	const goroutines = 8
	var (
		wg      sync.WaitGroup
		mu      sync.Mutex
		results = make([]error, 0, goroutines)
	)
	start := make(chan struct{})

	for i := 0; i < goroutines; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			_, _, err := f.svc.PromoteItem(ctx, f.itemID, f.userID)
			mu.Lock()
			results = append(results, err)
			mu.Unlock()
		}()
	}
	close(start)
	wg.Wait()

	successes := 0
	for _, err := range results {
		switch {
		case err == nil:
			successes++
		case errors.Is(err, service.ErrPlanningItemAlreadyPromoted):
			// expected loser
		default:
			t.Errorf("unexpected error from concurrent promote: %v", err)
		}
	}

	assert.GreaterOrEqual(t, successes, 1, "at least one promote must succeed")
	// The critical invariant: exactly one success means no duplicate card.
	// If this fails we have a race bug to fix.
	assert.Equal(t, 1, successes, "exactly one concurrent promote should succeed — a race created duplicate cards")
}
