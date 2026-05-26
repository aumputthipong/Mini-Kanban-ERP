//go:build integration

// Integration tests for the claim / release lifecycle. The claim guard is
// expressed in SQL (WHERE claimed_by_user_id IS NULL), so unit-mocking
// the queries would just be re-asserting the mock — these tests run
// against a real Postgres to confirm the guard actually serialises
// concurrent claimers, and that PromoteItem's in-tx auto-release fires.
package service_test

import (
	"context"
	"errors"
	"sync"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/aumputthipong/mini-erp-kanban/backend/internal/db"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/service"
	"github.com/aumputthipong/mini-erp-kanban/backend/internal/testutil"
)

// claimFixture sets up the minimum board+session+item plus two users.
// One owns the board, the other plays the "another user trying to claim
// the same item" role in race tests.
type claimFixture struct {
	pool        any // exposed only to satisfy go vet if a future test needs the pool directly
	queries     *db.Queries
	svc         *service.PlanningService
	ownerID     string
	otherID     string
	itemID      string
}

func newClaimFixture(t *testing.T) *claimFixture {
	t.Helper()
	ctx := context.Background()
	pool := testutil.NewTestDB(t)
	seed := testutil.NewSeed(t, pool)
	ownerID := seed.User(ctx)
	otherID := seed.User(ctx)
	boardID := seed.Board(ctx, ownerID)
	seed.Column(ctx, boardID, "TODO", 1)
	sessID := seed.PlanningSession(ctx, boardID, ownerID)
	itemID := seed.PlanningItem(ctx, sessID)
	return &claimFixture{
		pool:    pool,
		queries: db.New(pool),
		svc:     service.NewPlanningService(pool, db.New(pool)),
		ownerID: ownerID,
		otherID: otherID,
		itemID:  itemID,
	}
}

func TestClaimItem_HappyPath_FlipsRow(t *testing.T) {
	ctx := context.Background()
	f := newClaimFixture(t)

	require.NoError(t, f.svc.ClaimItem(ctx, f.itemID, f.ownerID))

	row, err := f.queries.GetPlanningItem(ctx, f.itemID)
	require.NoError(t, err)
	require.NotNil(t, row.ClaimedByUserID)
	assert.Equal(t, f.ownerID, *row.ClaimedByUserID)
	require.NotNil(t, row.ClaimedAt)
}

func TestClaimItem_AlreadyClaimedByOther_ReturnsSentinel(t *testing.T) {
	ctx := context.Background()
	f := newClaimFixture(t)

	require.NoError(t, f.svc.ClaimItem(ctx, f.itemID, f.otherID))

	err := f.svc.ClaimItem(ctx, f.itemID, f.ownerID)
	require.ErrorIs(t, err, service.ErrPlanningItemAlreadyClaimed)

	// Verify the original claim survived the failed attempt — the SQL
	// guard must not leave the row in a half-updated state.
	row, err := f.queries.GetPlanningItem(ctx, f.itemID)
	require.NoError(t, err)
	require.NotNil(t, row.ClaimedByUserID)
	assert.Equal(t, f.otherID, *row.ClaimedByUserID)
}

// TestClaimItem_ConcurrentClaimers_ExactlyOneWins is the race test that
// justifies pulling the claim guard into SQL rather than reading-then-
// writing in the service. Eight goroutines all aim at the same item; the
// "WHERE claimed_by_user_id IS NULL" predicate has to serialise them.
// Failure mode without the guard: multiple winners, last-write-wins on
// the row, claim audit log is meaningless.
func TestClaimItem_ConcurrentClaimers_ExactlyOneWins(t *testing.T) {
	ctx := context.Background()
	// Bespoke setup (rather than newClaimFixture) so all goroutines hit
	// the same DB instance with distinct claimer IDs. Each goroutine
	// needs its own userID — without that, two goroutines with the same
	// ID would both "succeed" against the SQL guard (since claimed_by =
	// existing user satisfies the WHERE on the second pass), masking
	// the failure mode.
	pool := testutil.NewTestDB(t)
	seed := testutil.NewSeed(t, pool)
	const goroutines = 8
	owner := seed.User(ctx)
	users := make([]string, goroutines)
	for i := range users {
		users[i] = seed.User(ctx)
	}
	boardID := seed.Board(ctx, owner)
	seed.Column(ctx, boardID, "TODO", 1)
	sessID := seed.PlanningSession(ctx, boardID, owner)
	itemID := seed.PlanningItem(ctx, sessID)
	svc := service.NewPlanningService(pool, db.New(pool))

	var (
		wg      sync.WaitGroup
		mu      sync.Mutex
		results = make([]error, 0, goroutines)
	)
	start := make(chan struct{})
	for i := 0; i < goroutines; i++ {
		userID := users[i]
		wg.Add(1)
		go func() {
			defer wg.Done()
			<-start
			err := svc.ClaimItem(ctx, itemID, userID)
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
		case errors.Is(err, service.ErrPlanningItemAlreadyClaimed):
			// expected loser
		default:
			t.Errorf("unexpected error from concurrent claim: %v", err)
		}
	}
	assert.Equal(t, 1, successes, "exactly one concurrent claim must win")
}

func TestReleaseItemAsOwner_OnlyClaimerSucceeds(t *testing.T) {
	ctx := context.Background()
	f := newClaimFixture(t)
	require.NoError(t, f.svc.ClaimItem(ctx, f.itemID, f.ownerID))

	// Wrong user — must return sentinel, leave claim intact.
	err := f.svc.ReleaseItemAsOwner(ctx, f.itemID, f.otherID)
	require.ErrorIs(t, err, service.ErrPlanningItemNotClaimedByYou)
	row, _ := f.queries.GetPlanningItem(ctx, f.itemID)
	require.NotNil(t, row.ClaimedByUserID, "wrong-user release must not clear the claim")

	// Right user — clears.
	require.NoError(t, f.svc.ReleaseItemAsOwner(ctx, f.itemID, f.ownerID))
	row, _ = f.queries.GetPlanningItem(ctx, f.itemID)
	assert.Nil(t, row.ClaimedByUserID)
}

func TestPromoteItem_WithExistingClaim_AutoReleasesAtomically(t *testing.T) {
	// The cross-feature interaction: claim → promote should clear the
	// claim AND insert the card AND flip status to "promoted" — all in
	// one tx. If any of those steps rolled back, the others should too.
	ctx := context.Background()
	f := newClaimFixture(t)
	require.NoError(t, f.svc.ClaimItem(ctx, f.itemID, f.otherID))

	item, _, err := f.svc.PromoteItem(ctx, f.itemID, f.ownerID)
	require.NoError(t, err)
	assert.Equal(t, "promoted", item.Status)

	row, err := f.queries.GetPlanningItem(ctx, f.itemID)
	require.NoError(t, err)
	assert.Nil(t, row.ClaimedByUserID, "promote must auto-release the claim")
	assert.Nil(t, row.ClaimedAt)
}
