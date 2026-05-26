-- Partial index for the reverse lookup card → planning item. Used by the
-- card detail modal's "ที่มา" section. Most cards aren't promoted from
-- planning, so a partial index (WHERE NOT NULL) stays small.
CREATE INDEX IF NOT EXISTS idx_planning_items_promoted_card
    ON planning_items(promoted_to_card_id)
    WHERE promoted_to_card_id IS NOT NULL;
