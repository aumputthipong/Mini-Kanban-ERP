-- Comment thread attached to each planning item. Lets the requirement
-- owner and the dev who picks up the item carry a focused conversation
-- next to the row itself instead of pinging in chat.
--
-- Soft delete (deleted_at) so the thread keeps a stable position — a hard
-- delete would shift indices around as people scroll the audit feed, and
-- "X deleted their comment" is more useful than a silent gap.
--
-- The partial index keeps the common case (list non-deleted comments for
-- one item, oldest first) cheap as the table grows.
CREATE TABLE planning_item_comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id    UUID NOT NULL REFERENCES planning_items(id) ON DELETE CASCADE,
    author_id  UUID NOT NULL REFERENCES users(id),
    body       TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_planning_comments_item
    ON planning_item_comments(item_id, created_at)
    WHERE deleted_at IS NULL;
