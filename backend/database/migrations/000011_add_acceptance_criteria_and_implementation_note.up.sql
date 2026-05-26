-- Adds two free-text fields that travel through the planning → board
-- pipeline:
--   acceptance_criteria — "what does done look like?" lines, one per
--                         newline. Captured on planning items (typically
--                         REQ) and copied to the resulting card on promote.
--   implementation_note — free-form hint to the developer (links, gotchas,
--                         rate-limits). Lives on every planning type and on
--                         every card.
--
-- Both are nullable TEXT — empty stays empty (NULL); the app layer treats
-- "" and NULL as equivalent. Mirrored across both tables so promotion can
-- copy the values directly without joining back to planning_items.

ALTER TABLE planning_items
    ADD COLUMN acceptance_criteria TEXT,
    ADD COLUMN implementation_note TEXT;

ALTER TABLE cards
    ADD COLUMN acceptance_criteria TEXT,
    ADD COLUMN implementation_note TEXT;
