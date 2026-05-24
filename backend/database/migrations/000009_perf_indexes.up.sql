-- Performance indexes identified during perf audit.
--
-- - cards.assignee_id: GetMyTasks filters WHERE c.assignee_id = $1. Without
--   an index this scans the entire cards table per request. Partial because
--   most cards have no assignee.
-- - card_tags.tag_id: junction table had only (card_id) indexed. Deleting a
--   tag (CASCADE) and any reverse lookup by tag forced a seq scan.
-- - boards.deleted_at: every "active boards" query filters deleted_at IS NULL.
--   Partial index keeps it tiny.
CREATE INDEX IF NOT EXISTS idx_cards_assignee_id
    ON cards(assignee_id)
    WHERE assignee_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_card_tags_tag_id
    ON card_tags(tag_id);

CREATE INDEX IF NOT EXISTS idx_boards_active
    ON boards(deleted_at)
    WHERE deleted_at IS NULL;
