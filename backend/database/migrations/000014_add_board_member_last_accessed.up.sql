-- Per-user "recently opened" sort for the project list. The board's own
-- updated_at only moves on edits (title/budget), so it can't act as a
-- recency signal for view access. Tracking the touch on board_members
-- keeps it per-user from day one — when shared boards become common we
-- don't have to migrate off a global column on boards.
--
-- Nullable on purpose: existing rows aren't backfilled. The list query
-- COALESCEs to b.updated_at as a fallback for legacy memberships.
-- No index — typical user has < 100 boards; ORDER BY on a small filtered
-- set is fine without one.
ALTER TABLE board_members
    ADD COLUMN last_accessed_at TIMESTAMPTZ;
