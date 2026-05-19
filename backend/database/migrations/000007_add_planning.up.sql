-- Planning section — lightweight discovery journal scoped per board.
-- Sessions hold a single meeting/working-session's worth of items;
-- items are flat (no hierarchy) and carry one of three types plus
-- a status that drives lifecycle (live → selected → promoted, or
-- live → dropped). Promoting copies the title into a Kanban card
-- and records the link back via promoted_to_card_id.
--
-- See docs/decisions/ (if added later) for the model rationale.
CREATE TABLE planning_sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    title       VARCHAR(255) NOT NULL,
    label       TEXT,
    meeting_at  TIMESTAMPTZ,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE planning_items (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id            UUID NOT NULL REFERENCES planning_sessions(id) ON DELETE CASCADE,
    type                  VARCHAR(8) NOT NULL CHECK (type IN ('REQ','DEC','Q')),
    title                 TEXT NOT NULL,
    description           TEXT,
    status                VARCHAR(12) NOT NULL DEFAULT 'live'
        CHECK (status IN ('live','selected','dropped','promoted')),
    promoted_to_card_id   UUID REFERENCES cards(id) ON DELETE SET NULL,
    position              DOUBLE PRECISION NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_planning_sessions_board ON planning_sessions(board_id);
CREATE INDEX idx_planning_items_session ON planning_items(session_id);
