-- Per-user workspace preferences. Created on first read (GET upserts a
-- default row) so the table acts as the single source of truth: the API
-- never branches on "missing row". Defaults match the S.2 plan — Today is
-- the default landing for a new user, and Asia/Bangkok is the workspace TZ
-- until per-user timezone is exposed in the UI.
--
-- show_all_cards toggles whether the My Work / Today inbox surfaces
-- unassigned cards on boards the user is a member of (intended for solo
-- users who don't bother assigning cards to themselves).
CREATE TABLE IF NOT EXISTS user_settings (
    user_id          UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    default_landing  VARCHAR(20) NOT NULL DEFAULT 'today'
        CHECK (default_landing IN ('today', 'my_work', 'all_boards')),
    show_all_cards   BOOLEAN     NOT NULL DEFAULT FALSE,
    timezone         VARCHAR(50) NOT NULL DEFAULT 'Asia/Bangkok',
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
