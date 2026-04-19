CREATE TABLE activities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id    UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    actor_id    UUID NOT NULL REFERENCES users(id),
    event_type  VARCHAR(40) NOT NULL,
    entity_type VARCHAR(20) NOT NULL,
    entity_id   UUID,
    payload     JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_activities_board_time ON activities(board_id, created_at DESC);
